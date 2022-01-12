# discord-github-bot
This bot will create a GitHub issue, when a new message will be sent to a specific channel in discord. <br />
You can also include the attachments from the message, by setting `includeAttachments: true`. <br />
The attachments will be saved within GitHub after the GitHub fully uploaded the request to its servers. 
Therefore, it is save to delete the message afterwards. Currently, it will automatically delete the successfully read messages after 90 seconds.<br />
To be able to read data from discord, you need to create a discord bot https://discord.com/developers/applications. <br />
In order to use this bot, you need to set up a "config.json" in the root folder (at the level of "index.js"). You can use the `example.config.json` as a template.
After editing you should rename the file to `config.json`. <br />
To start the bot just type `node .` in the console in the root folder of this project.<br />
***Hint: Prevent users from overfloating your GitHub repo by enabling slow chat in the Discord channel.***

## Creating a Discord bot
* Simply follow the link https://discord.com/developers/applications and click on "New Application"
* Give your bot a name and click on "Create"
* Go to the "Bot" section where you can create a new one by clicking on "Add Bot". This creates a bot named after the application. After adding the bot you can edit the name if you like
* Copy the token of the bot and add it to the config file

## Adding the bot to your Discord server
* In the navigation of your previously created application click on "OAuth2"
* In the sub navigation go to "URL Generator"
* As scope you chose "bot". Afterwards the permissions section for this bot will open
* Set the permission "Administrator"
* Copy the URL at the end of the site and paste it in to your browser address line
* Add the Bot to the prefered server

## Creating a GitHub token
* Go to your settings, by clicking your profile image in the upper right corner in GitHub and choosing "settings"
* Chose "developer settings" in the navigation of the settings
* Click on "Personal access tokens" and "Generate new token"
* Make in note, to be able to recognize this token and set the expiration date
** If you chose to let your token expire you must remember to renew it after expiration, otherwise GitHub will not grant access for the request of the bot
* Scopes: `repo`, `write:packages`

## Configuration properties
| Property				 | Optional | Example								 | Description																														 |
| ---------------------- | -------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| token					 | no		| "aaodj29eqdekwojd92ahe28dhadjda02dﬂ0j" | The token of the discord bot																										 |
| channelId				 | no		| "84704831957103822931"				 | ID of the discord issue channel on your server																					 |
| gitUser				 | no		| "CeyKie"							     | URL of the GIT repository, the issue should be created in																		 |
| gitRepo				 | no		| "discord-github-bot"				     | URL of the GIT repository, the issue should be created in																		 |
| gitToken				 | no		| "asd_asodjawidzh28hadjuawd"			 | Token, created in your GitHub account, to authenticate the request																 |
| exludeUsers			 | yes		| [ "935710237185", "105681023103" ]	 | An array, which includes a list of strings from the users, the bot should ignore. Can be empty []								 |
| includeAttachments	 | yes		| false								     | Set this to true, if you want to include attachments from the message in the GitHub issue.										 |
| successMessage		 | yes		| "Your ticket was created."		     | The message that will be shown in the discord channel, when the issue was created successfully. Will be deleted after 90 seconds. |