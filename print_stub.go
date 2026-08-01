//go:build !windows

package main

import "errors"

func printData(name, data string) (string, error) {
	return "", errors.New("yazdırma yalnız Windows sürümünde kullanılabilir")
}

func revealPath(path string) error {
	return errors.New("klasör açma yalnız Windows sürümünde kullanılabilir")
}
