PORT ?= 3333
NODE_VERSION ?= 22
NVM_DIR ?= $(HOME)/.nvm

# Mintlify does not support node 25+, so pin the preview to an LTS node.
NODE_BIN := $(shell ls -d $(NVM_DIR)/versions/node/v$(NODE_VERSION).*/bin 2>/dev/null | sort -V | tail -1)

.PHONY: dev broken-links help

help:
	@echo "make dev           start the docs preview on http://localhost:$(PORT)"
	@echo "make broken-links  check the docs for broken links"
	@echo ""
	@echo "overrides: PORT=4000 NODE_VERSION=22"

dev:
	@test -n "$(NODE_BIN)" || { echo "node $(NODE_VERSION) not found in $(NVM_DIR)/versions/node, run: nvm install $(NODE_VERSION)"; exit 1; }
	@PATH="$(NODE_BIN):$$PATH" npx -y mint@latest dev --port $(PORT)

broken-links:
	@test -n "$(NODE_BIN)" || { echo "node $(NODE_VERSION) not found in $(NVM_DIR)/versions/node, run: nvm install $(NODE_VERSION)"; exit 1; }
	@PATH="$(NODE_BIN):$$PATH" npx -y mint@latest broken-links
