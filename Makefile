NODE_CONTAINER?=node:16-alpine

NODE_RUN=docker run --rm -v "$(PWD):/workdir" -w "/workdir" --rm $(NODE_CONTAINER)

install:
	$(NODE_RUN) yarn install

lint:
	$(NODE_RUN) yarn prettier -c src/ tests/

lint-fix:
	$(NODE_RUN) yarn prettier -w src/ tests/

test:
	$(NODE_RUN) yarn test

publish:
	docker-run-root node:alpine sh -c "/usr/local/bin/npm adduser; /usr/local/bin/npm publish"

.PHONY: tests
