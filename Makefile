
test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		tests

publish:
	docker-run-root node:alpine sh -c "/usr/local/bin/npm adduser; /usr/local/bin/npm publish"

.PHONY: tests
