APP := dashboard

.PHONY: install dev build start lint test typecheck clean

install:
	pnpm install

dev:
	pnpm --filter $(APP) dev

build:
	pnpm --filter $(APP) build

start:
	pnpm --filter $(APP) start

lint:
	pnpm --filter $(APP) lint

test:
	pnpm --filter $(APP) test

typecheck:
	pnpm --filter $(APP) typecheck

clean:
	rm -rf apps/$(APP)/.next node_modules apps/$(APP)/node_modules
