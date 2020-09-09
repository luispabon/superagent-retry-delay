lint:
	yarn prettier -c src/ tests/

lint-fix:
	yarn prettier -w src/ tests/

test:
	yarn test

upload-coverage:
	yarn coverage

publish:
	docker-run-root node:alpine sh -c "/usr/local/bin/npm adduser; /usr/local/bin/npm publish"

.PHONY: tests
