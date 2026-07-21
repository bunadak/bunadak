package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App is the Go backend exposed to the frontend via Wails bindings. The pro
// frontend calls these through window.go.main.App.* and gracefully falls back
// to browser localStorage when they are not present (e.g. running in a plain
// browser during development).
type App struct {
	ctx context.Context
	dir string
}

// NotebookMeta is the lightweight index entry shown in the library.
type NotebookMeta struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Updated int64  `json:"updated"`
	Pages   int    `json:"pages"`
	Thumb   string `json:"thumb"`
}

// notebookHeader is the subset of a serialized notebook we need to build a meta.
type notebookHeader struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Updated int64  `json:"updated"`
	Pages   []struct {
		ID string `json:"id"`
	} `json:"pages"`
	Thumb string `json:"thumb"`
}

func NewApp() *App { return &App{} }

// startup resolves and prepares the per-user storage directory.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	base, err := os.UserConfigDir()
	if err != nil || base == "" {
		base, _ = os.UserHomeDir()
	}
	a.dir = filepath.Join(base, "NotisPro", "notebooks")
	_ = os.MkdirAll(a.dir, 0o755)
}

func (a *App) path(id string) string {
	// keep ids filesystem-safe
	id = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, id)
	return filepath.Join(a.dir, id+".json")
}

// SaveNotebook persists a serialized notebook (JSON string) to disk.
func (a *App) SaveNotebook(id string, data string) error {
	if a.dir == "" {
		return nil
	}
	return os.WriteFile(a.path(id), []byte(data), 0o644)
}

// LoadNotebook returns the raw serialized notebook JSON for an id.
func (a *App) LoadNotebook(id string) (string, error) {
	b, err := os.ReadFile(a.path(id))
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// DeleteNotebook removes a notebook file.
func (a *App) DeleteNotebook(id string) error {
	return os.Remove(a.path(id))
}

// ListNotebooks scans the storage directory and returns library metadata,
// newest first.
func (a *App) ListNotebooks() ([]NotebookMeta, error) {
	out := []NotebookMeta{}
	if a.dir == "" {
		return out, nil
	}
	entries, err := os.ReadDir(a.dir)
	if err != nil {
		return out, err
	}
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".json") {
			continue
		}
		b, err := os.ReadFile(filepath.Join(a.dir, e.Name()))
		if err != nil {
			continue
		}
		var h notebookHeader
		if json.Unmarshal(b, &h) != nil {
			continue
		}
		out = append(out, NotebookMeta{
			ID: h.ID, Title: h.Title, Updated: h.Updated,
			Pages: len(h.Pages), Thumb: h.Thumb,
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Updated > out[j].Updated })
	return out, nil
}

// ExportFile opens a native save dialog and writes decoded bytes to the chosen
// path. `data` is a data: URL or bare base64 string. Returns the saved path
// (empty if the user cancelled).
func (a *App) ExportFile(defaultName string, data string) (string, error) {
	if i := strings.Index(data, ","); i >= 0 && strings.HasPrefix(data, "data:") {
		data = data[i+1:]
	}
	raw, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		return "", err
	}
	dest, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: defaultName,
		Title:           "Dışa Aktar",
	})
	if err != nil || dest == "" {
		return "", err
	}
	if err := os.WriteFile(dest, raw, 0o644); err != nil {
		return "", err
	}
	return dest, nil
}

// AppInfo exposes version metadata to the About screen.
func (a *App) AppInfo() map[string]string {
	return map[string]string{
		"name":    "Notis Pro",
		"version": "2.0.0",
		"channel": "pro",
	}
}
