build_image:
	docker build -t local_container local_container

build_pdf:
	docker run --rm -v .:/app local_container pandoc --citeproc --bibliography=docs/references.bib --to pdf --output docs/riport.pdf --embed-resources --standalone --resource-path=docs docs/riport.md --csl=docs/ieee.csl