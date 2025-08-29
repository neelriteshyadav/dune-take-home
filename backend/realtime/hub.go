package realtime

import (
	"context"
	"sync"
	"time"
)

type Hub struct {
	mu      sync.Mutex
	waiters map[string][]chan struct{} // formId -> subscribers
}

func NewHub() *Hub { return &Hub{waiters: map[string][]chan struct{}{}} }

func (h *Hub) Notify(formID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if chans, ok := h.waiters[formID]; ok {
		for _, ch := range chans {
			select {
			case ch <- struct{}{}:
			default:
			}
		}
	}
	h.waiters[formID] = nil
}

func (h *Hub) Wait(ctx context.Context, formID string, maxWait time.Duration) error {
	ch := make(chan struct{}, 1)

	h.mu.Lock()
	h.waiters[formID] = append(h.waiters[formID], ch)
	h.mu.Unlock()

	timer := time.NewTimer(maxWait)
	defer timer.Stop()

	select {
	case <-ch:
		return nil
	case <-timer.C:
		return context.DeadlineExceeded
	case <-ctx.Done():
		return ctx.Err()
	}
}
