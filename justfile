# List available recipes
default:
    @just --list

# Install dependencies
install:
    bun install

# Start development server
dev:
    bun --bun vite

# Build for production
build:
    bun --bun vite build

# Preview production build
preview:
    bun --bun vite preview

# Clean build artifacts and dependencies
clean:
    rm -rf dist dist-ssr node_modules

# Update dependencies to latest versions
update:
    bun update

# Check for outdated dependencies
outdated:
    bun outdated

# Open project in browser (after starting dev server separately)
open:
    open http://localhost:5173
