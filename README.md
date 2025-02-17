Scripts for Bitburner 2.7.0. An attempt to ground-up rewrite the older set of scripts.

The pseudocode of the main looping script is as follows:

-kill all scripts except the looping script (this ensures subscripts fire properly if the game is closed and reopened while running)

-initialise a number of variables:
	-number of implants purchased per loop
	-if the unfocused penalty exists or not

-start various manager scripts
	-hacking manager
	-gang manager
	-corporation manager
	-sleeve manager
	-stock trading manager

