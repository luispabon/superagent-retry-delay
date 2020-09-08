
test:
	yarn test

coverage:
	yarn coverage

publish:
	docker-run-root node:alpine sh -c "/usr/local/bin/npm adduser; /usr/local/bin/npm publish"

.PHONY: tests
