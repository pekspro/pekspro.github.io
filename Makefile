install:
	bundle install --path vendor/bundle

upgrade:
	bundle update

s serve:
	bundle exec jekyll serve --source devblog --destination build/ --livereload --future --trace
