
default: rt-plugin.xpi

.PHONY: chrome.jar install

FILES=chrome.jar chrome.manifest defaults/ install.rdf

chrome.jar:
	(cd chrome/ ; zip -r ../chrome.jar * )

rt-plugin.xpi: ${FILES}
	echo ${FILES}
	zip -r rt-plugin.xpi ${FILES}

#install: rt-plugin.xpi
#	cp rt-plugin.xpi ~/.thunderbird/qo8q4rzw.test/extensions/RTPlugin@FrOSCon.xpi
