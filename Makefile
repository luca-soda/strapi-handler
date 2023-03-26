merge-tests:
	git merge main --no-commit --no-ff && git checkout --ours .gitignore && git add .gitignore && git commit -m "Merge branch 'main' into test-ready"