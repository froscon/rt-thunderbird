
.PHONY: chrome.jar install

FILES=chrome.jar chrome.manifest defaults/ install.rdf

chrome.jar:
	(cd chrome/ ; zip -r ../chrome.jar * )

plugin.xpi: ${FILES}
	echo ${FILES}
	zip -r plugin.xpi ${FILES}

install: plugin.xpi
	cp plugin.xpi ~/.thunderbird/qo8q4rzw.test/extensions/RTPlugin@FrOSCon.xpi
