# List available recipes
default:
    @just --list

# Install dependencies
install:
    yarn install

# Start development server
dev:
    yarn dev

# Build for production
build:
    yarn build

# Preview production build
preview:
    yarn preview

# Clean build artifacts and dependencies
clean:
    rm -rf dist dist-ssr node_modules

# Update dependencies to latest versions
update:
    yarn upgrade

# Check for outdated dependencies
outdated:
    yarn outdated

# Open project in browser (after starting dev server separately)
open:
    open http://localhost:5173
