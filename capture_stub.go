//go:build !windows

package main

import "errors"

// captureScreenRegion yalnız Windows'ta desteklenir; diğer platformlarda
// frontend sessizce normal (görüntüsüz) çözüm akışına düşer.
func captureScreenRegion(x, y, w, h int) (string, error) {
	return "", errors.New("ekran yakalama yalnız Windows'ta desteklenir")
}
