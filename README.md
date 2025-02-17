Scripts for Bitburner 2.7.0. An attempt to ground-up rewrite the older set of scripts.

The pseudocode of the main looping script is as follows:

-kill all scripts except the looping script
	-this ensures subscripts fire properly if the game is closed and reopened while running

-initialise a number of variables:
	-number of implants purchased per loop
	-if the unfocused penalty exists or not

-grab any already existing faction invites
	-anything inviting this early in a loop is usually a special faction of some kind
	-exclude city factions, these are handled later

-start various manager scripts
	-hacking manager
	-gang manager
	-corporation manager
	-sleeve manager
	-stock trading manager

-do some hacking training for initial hacking levels
	-only for a few minutes since the last augment install, otherwise skip
	-get sleeves in on this?

-obtain programs
	-manually creating the first two is quick enough and the intelligence exp is nice
		-do more hacking training for levels if need be
	-the last three are better purchased via TOR
		-earn some money if need be


