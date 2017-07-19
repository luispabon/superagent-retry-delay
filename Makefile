
test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		tests

.PHONY: tests