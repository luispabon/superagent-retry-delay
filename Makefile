NODE_CONTAINER?=node:12-alpine

NODE_RUN=docker run --rm -v "$(PWD):/workdir" -w "/workdir" --rm $(NODE_CONTAINER)

install:
	$(NODE_RUN) yarn install

lint:
	$(NODE_RUN) yarn prettier -c src/ tests/

lint-fix:
	$(NODE_RUN) yarn prettier -w src/ tests/

test:
	$(NODE_RUN) yarn test

upload-coverage:
	$(NODE_RUN) yarn coverage

publish:
	docker-run-root node:alpine sh -c "/usr/local/bin/npm adduser; /usr/local/bin/npm publish"

.PHONY: tests
