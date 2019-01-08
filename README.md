This is a web based XRtube client App. It is Recommended to run in fullscreen mode.

Best compatible with Chrome browser.

![](xrtube-peru1-8k.jpg)

Demo: http://lab.xrtube.net:3000/?config=twice-8k.json

![](xrtube-twice-poi.jpg)

Some limitations apply:

- Currently not support for DRM protected content as this is often solutions specific to each site
- In ServerSide , DRM contents accepts and ready to transmission.
- On ClientSide , DRM contents compatible with our XRtube-Client App.

# Installation

Get the code from Github or fork the repository if you plan to contribute to this project.

		git clone https://github.com/xrtube/xrtube-client.git
		
Install the necessary node modules

		npm install
		
Start the Node express app

		npm start
		
# Usage

When the Node express app is up and running you can direct your Chrome browser to:

		http://lab.xrtube.net:3000/?config=twice-8k.json
		
		or build in localhost, you can play with 
		http://localhost:3000/?config=twice-8k.json
		http://localhost:3000/?config=peru-8k.json
		
		Available Test Stream is except twice-8k.json , peru-8k.json
		
where twice-8k.json and example.json is a configuration file placed in the directory config/ and can look like this:

		{
			"row0": [
				{ "title": "View port title",
				  "manifest": "http://example.com/master.m3u8",
				  "type": "hls" }
			],
			"row1": [
				{ "title": "View port title 2",
				  "manifest": "http://example.com/manifest.mpd",
				  "type": "dash" }
			]
		}

To toggle 'Space' key to Play or Stop. A green border indicates for which Tile(viewport) is selected. 


## Keyboard Shortcuts
- SPACE     : toggle play / pause for all viewports
- '+' or '=' : Zoom In
- '-' or '-' : Zoom out
- mouse click : Select Tile
- F - toggle fullscreen mode
		
# Contribution and Contact

https://trustfarm.io <br>
https://trustcoinmining.com <br>

Email : info@trustfarm.io

We are very happy if you want to contribute to this project. Just follow the "normal" procedures and:

1. Fork this repository
2. Create a topic branch in your fork
3. Add feature or fix bug in the topic branch
4. Issue a pull request explaining what has been done

