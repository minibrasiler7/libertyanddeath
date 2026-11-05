/* Liberty or Death — cartes transcrites depuis Images/Cartes (texte exact) */
(function(root){const CARDS={
"1": {
"id": 1,
"title": "Waxhaws Massacre",
"period": "79-80",
"order": [
"patriots",
"british",
"french",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Tarleton’s quarter:",
"unshaded": "In 1 space with British, remove 2 Continentals to Casualties, shift 1 level toward Active Support. Place 2 Propaganda there.",
"shaded_label": "Patriot rage:",
"shaded": "Patriots free March to and free Battle in 1 space. Place 2 Propaganda there. Shift 1 level toward Neutral.",
"winter": false,
"file": "01 Waxhaws Massacre.png"
},
"2": {
"id": 2,
"title": "“Common Sense”",
"period": "75-76",
"order": [
"patriots",
"british",
"french",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "British organize a backlash:",
"unshaded": "British may place 2 British Regulars and 2 Tories in any 1 City. Place 2 Propaganda markers there. British Resources +4.",
"shaded_label": "Impact of the writings of Thomas Paine:",
"shaded": "Shift 2 Cities 1 level each toward Active Opposition. Place 2 Propaganda markers in each.",
"winter": false,
"file": "02 Common Sense.png"
},
"3": {
"id": 3,
"title": "George Rogers Clark’s Illinois Campaign",
"period": "77-78",
"order": [
"patriots",
"british",
"french",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Indian retaliation raids succeed:",
"unshaded": "Remove all Patriot pieces in Northwest and Southwest.",
"shaded_label": "Patriot offensive succeeds:",
"shaded": "Patriots may place 2 Militia and free Partisans in both Northwest and Southwest.",
"winter": false,
"file": "03 George Rogers Clark's Illinois Campaign.png"
},
"4": {
"id": 4,
"title": "The Penobscot Expedition",
"period": "75-76",
"order": [
"patriots",
"british",
"french",
"indians"
],
"icons": {
"british": "none",
"indians": "musket",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Expedition fails and ships scuttled:",
"unshaded": "Remove 3 Patriot Militia. Patriot Resources –2.",
"shaded_label": "Expedition is a success:",
"shaded": "Place 1 Fort or Village and 3 Militia or War Parties in Massachusetts.",
"winter": false,
"file": "04 Penobscot Expedition.png"
},
"5": {
"id": 5,
"title": "William Alexander, Lord Stirling",
"period": "77-78",
"order": [
"patriots",
"british",
"indians",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Captured at Long Island:",
"unshaded": "Patriots Ineligible through the next card.",
"shaded_label": "“…bravest man in America”:",
"shaded": "Patriots may free March to and free Battle in 1 space.",
"winter": false,
"file": "05 William Lord Stirling.png"
},
"6": {
"id": 6,
"title": "Benedict Arnold",
"period": "75-76",
"order": [
"patriots",
"british",
"indians",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Treachery undermines the Patriot cause:",
"unshaded": "Remove 1 Patriot Fort to Casualties and 2 Patriot Militia to Available from 1 Colony.",
"shaded_label": "Shows great leadership and resourcefulness:",
"shaded": "Remove 1 British Fort and 2 British cubes from 1 space to Casualties.",
"winter": false,
"file": "06 Benedict Arnold.png"
},
"7": {
"id": 7,
"title": "John Paul Jones",
"period": "79-80",
"order": [
"patriots",
"british",
"indians",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Limited impact:",
"unshaded": "British Resources + 3. Lower FNI 1 level. Move up to 2 British Regulars from Available to West Indies or any City.",
"shaded_label": "Significant benefit:",
"shaded": "Patriot Resources +5. Raise FNI 1 level.",
"winter": false,
"file": "07 John Paul Jones.png"
},
"8": {
"id": 8,
"title": "Culper Spy Ring",
"period": "77-78",
"order": [
"patriots",
"british",
"indians",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "musket",
"french": "none"
},
"unshaded_label": "Hercules Mulligan arrested:",
"unshaded": "Activate 3 Patriot Militia anywhere.",
"shaded_label": "Spies reduce British effectiveness:",
"shaded": "Remove 3 British cubes to Casualties.",
"winter": false,
"file": "08 Culper Spy Ring.png"
},
"9": {
"id": 9,
"title": "Friedrich Wilhelm von Steuben",
"period": "77-78",
"order": [
"patriots",
"french",
"british",
"indians"
],
"icons": {
"british": "none",
"indians": "sword",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Patriots do not listen:",
"unshaded": "British may Skirmish in up to 3 spaces.",
"shaded_label": "Patriots more effective:",
"shaded": "Patriots may Skirmish in up to 3 spaces.",
"winter": false,
"file": "09 Friedrich Wilhelm von Steuben.png"
},
"10": {
"id": 10,
"title": "Benjamin Franklin Travels to France",
"period": "75-76",
"order": [
"patriots",
"french",
"british",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Franklin is ineffective in France:",
"unshaded": "Shift any 2 Cities 1 level each toward Active Support.",
"shaded_label": "Franklin takes France by storm:",
"shaded": "French Resources +3. Patriot Resources +2.",
"winter": false,
"file": "10 Benjamin Franklin Travels to France.png"
},
"11": {
"id": 11,
"title": "Thaddeus Kosciuszko, Expert Engineer",
"period": "77-78",
"order": [
"patriots",
"french",
"british",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Patriots ignore:",
"unshaded": "Patriots remove any 2 Patriot Forts.",
"shaded_label": "Patriots embrace:",
"shaded": "In each of 2 Patriot Controlled spaces, Patriots may remove 1 Patriot piece and add 1 Patriot Fort.",
"winter": false,
"file": "11 Thaddeus Kosciuszkho Expert Engineer.png"
},
"12": {
"id": 12,
"title": "Martha Washington to Valley Forge",
"period": "77-78",
"order": [
"patriots",
"french",
"british",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "No Bread — No Soldiers:",
"unshaded": "Execute Patriot Desertion as per Winter Quarters Round.",
"shaded_label": "Women step in to bolster support and raise money:",
"shaded": "Patriot Resources +5.",
"winter": false,
"file": "12 Martha Washington to Valley Forge.png"
},
"13": {
"id": 13,
"title": "“…the origin of all our misfortunes”",
"period": "75-76",
"order": [
"patriots",
"french",
"indians",
"british"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Soldiers leave:",
"unshaded": "Execute Patriot Desertion as per Winter Quarters Round.",
"shaded_label": "Patriots strengthen commitment:",
"shaded": "In up to 4 spaces with Militia, Patriots may add an Active Militia.",
"winter": false,
"file": "13 the origin of all our misfortunes.png"
},
"14": {
"id": 14,
"title": "Overmountain Men Fight for NC",
"period": "77-78",
"order": [
"patriots",
"french",
"indians",
"british"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Trouble in North Carolina:",
"unshaded": "Indians free Scout or March to North Carolina or Southwest, then Indians War Path or British free Battle in that space.",
"shaded_label": "Over Mountain Men make trouble:",
"shaded": "Patriots free March to and free Battle in North Carolina or Southwest.",
"winter": false,
"file": "14 Overmountain Men Fight for NC.png"
},
"15": {
"id": 15,
"title": "Morgan’s Rifles",
"period": "75-76",
"order": [
"patriots",
"french",
"indians",
"british"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Virginians unhappy their Militia was sent to New England:",
"unshaded": "Shift Virginia 2 levels toward Active Support. Place 2 Tories there.",
"shaded_label": "Elite light infantry unit commanded by Daniel Morgan is deployed:",
"shaded": "Patriots perform free March to any 1 Colony, then free Battle, then Partisans there.",
"winter": false,
"file": "15 Morgan's Rifles.png"
},
"16": {
"id": 16,
"title": "Mercy Warren’s “The Motley Assembly”",
"period": "79-80",
"order": [
"patriots",
"french",
"indians",
"british"
],
"icons": {
"british": "none",
"indians": "sword",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Anger rallies the Tories:",
"unshaded": "Place 2 Tories anywhere.",
"shaded_label": "Rallies the Patriots:",
"shaded": "Shift 1 City to Passive Opposition.",
"winter": false,
"file": "16 Mercy Warren's The Motley Assembly.png"
},
"17": {
"id": 17,
"title": "Jane McCrea Murdered by Indians",
"period": "77-78",
"order": [
"patriots",
"indians",
"british",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "sword"
},
"unshaded_label": "Indian Country fears:",
"unshaded": "Remove 1 Patriot Fort from 1 Indian Reserve Province.",
"shaded_label": "Backlash against Indians:",
"shaded": "Remove 1 Indian Village.",
"winter": false,
"file": "17 Jane McCrea Murdered by Indians.png"
},
"18": {
"id": 18,
"title": "“If it hadn’t been so stormy…”",
"period": "79-80",
"order": [
"patriots",
"indians",
"british",
"french"
],
"icons": {
"british": "musket",
"indians": "musket",
"patriots": "musket",
"french": "sword"
},
"unshaded_label": "Murphy’s Law in application:",
"unshaded": "Any 1 Faction Ineligible through the next card.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "18 If it hadn't been so stormy.png"
},
"19": {
"id": 19,
"title": "Legend of Nathan Hale",
"period": "79-80",
"order": [
"patriots",
"indians",
"british",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Poor information gathering plagues the Patriots:",
"unshaded": "Patriot Resources –4.",
"shaded_label": "The legend grows and Patriots respond:",
"shaded": "Place 3 Patriot Militia anywhere. Patriot Resources +3.",
"winter": false,
"file": "19 Legend of Nathan Hale.png"
},
"20": {
"id": 20,
"title": "Continental Marines",
"period": "75-76",
"order": [
"patriots",
"indians",
"british",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Deployed to Louisiana to block British:",
"unshaded": "Patriots remove 4 Continentals from map to Available.",
"shaded_label": "Deployed to defend New Jersey:",
"shaded": "Patriots place 4 Continentals in New Jersey.",
"winter": false,
"file": "20 Continental Marines.png"
},
"21": {
"id": 21,
"title": "The Gamecock Thomas Sumter",
"period": "79-80",
"order": [
"patriots",
"indians",
"french",
"british"
],
"icons": {
"british": "none",
"indians": "musket",
"patriots": "none",
"french": "none"
},
"unshaded_label": "British pressure the Gamecock:",
"unshaded": "Shift South Carolina or Georgia 2 levels toward Active Support.",
"shaded_label": "“My greatest plague”:",
"shaded": "Patriots free March to and free Battle in South Carolina or Georgia.",
"winter": false,
"file": "21 The Gamecock Thomas Sumter.png"
},
"22": {
"id": 22,
"title": "The Newburgh Conspiracy",
"period": "79-80",
"order": [
"patriots",
"indians",
"french",
"british"
],
"icons": {
"british": "none",
"indians": "musket",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Patriot officers threaten to revolt:",
"unshaded": "Remove 4 Patriot Militia and/or Continentals in any 1 Colony.",
"shaded_label": "Tories revolt over lack of support:",
"shaded": "Immediately execute Tory Desertion as per Winter Quarters Round.",
"winter": false,
"file": "22 The Newburgh Conspiracy.png"
},
"23": {
"id": 23,
"title": "Lieutenant Colonel Francis Marion",
"period": "79-80",
"order": [
"patriots",
"indians",
"french",
"british"
],
"icons": {
"british": "musket",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "“Damned old fox” breaks an ankle:",
"unshaded": "British or Indians move all Patriot units in NC or SC into an adjacent Province.",
"shaded_label": "With Liberty or Death on his cap:",
"shaded": "If Militia occupy North Carolina or South Carolina, remove 4 British units from that space.",
"winter": false,
"file": "23 Lieutenant Colonel Francis Marion.png"
},
"24": {
"id": 24,
"title": "Declaration of Independence",
"period": "75-76",
"order": [
"patriots",
"indians",
"french",
"british"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Patriots stay fractured:",
"unshaded": "Remove 2 Continentals, 2 Militia and 1 Patriot Fort.",
"shaded_label": "Patriots come together:",
"shaded": "Place up to 3 Militia anywhere, 1 Propaganda with each. Place 1 Fort anywhere.",
"winter": false,
"file": "24 Declaration of Independence.png"
},
"25": {
"id": 25,
"title": "British Prison Ships",
"period": "79-80",
"order": [
"british",
"patriots",
"french",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "British efficiently deal with prisoners:",
"unshaded": "Shift 2 Cities 1 level each toward Passive Support.",
"shaded_label": "British reputation damaged:",
"shaded": "In 2 Cities place 1 Militia and shift each 1 level toward Passive Opposition. Place 1 Propaganda in each.",
"winter": false,
"file": "25 British Prison Ships.png"
},
"26": {
"id": 26,
"title": "Josiah Martin, NC Royal Governor, Plots",
"period": "77-78",
"order": [
"british",
"patriots",
"french",
"indians"
],
"icons": {
"british": "none",
"indians": "sword",
"patriots": "none",
"french": "none"
},
"unshaded_label": "North Carolina Tories rise up:",
"unshaded": "Place 1 British Fort or 2 Tories in North Carolina.",
"shaded_label": "North Carolina Tories targeted:",
"shaded": "Patriots may free March to then free Battle in North Carolina.",
"winter": false,
"file": "26 Josia Martin NC Royal Governor Plots.png"
},
"27": {
"id": 27,
"title": "The Queen's Rangers Show for Battle",
"period": "77-78",
"order": [
"british",
"patriots",
"french",
"indians"
],
"icons": {
"british": "none",
"indians": "sword",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Reporting for duty:",
"unshaded": "Place 2 Tories from Unavailable or Available in each of 2 Colonies with British Control.",
"shaded_label": "Patriots rally against the Queen's Rangers:",
"shaded": "Shift 2 Cities 1 level each toward Active Opposition and place 1 Militia in each.",
"winter": false,
"file": "27 The Queen's Rangers Show for Battle.png"
},
"28": {
"id": 28,
"title": "Battle of Moore's Creek Bridge",
"period": "75-76",
"order": [
"british",
"patriots",
"french",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Tories win:",
"unshaded": "In any 1 space, replace every 1 Militia with 2 Tories.",
"shaded_label": "Patriots win:",
"shaded": "In any 1 space, replace every 1 Tory with 2 Militia.",
"winter": false,
"file": "28 Battle of Moore's Creek Bridge.png"
},
"29": {
"id": 29,
"title": "Edward Bancroft, British Spy",
"period": "75-76",
"order": [
"british",
"patriots",
"indians",
"french"
],
"icons": {
"british": "musket",
"indians": "musket",
"patriots": "musket",
"french": "sword"
},
"unshaded_label": "Critical plans leaked:",
"unshaded": "Patriots or Indians must Activate their Militia or War Parties until ½ of them are Active, rounding down.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "29 Edward Bancroft, British Spy.png"
},
"30": {
"id": 30,
"title": "Hessians",
"period": "75-76",
"order": [
"british",
"patriots",
"indians",
"french"
],
"icons": {
"british": "musket",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Hessians are a force multiplier:",
"unshaded": "In each of up to 3 British Controlled spaces with British Regulars, place up to 2 British Regulars from Available or Unavailable. British Resources +2.",
"shaded_label": "Hessians settle in Colonies:",
"shaded": "British remove 1 in 5 British Regulars from the map, rounding down.",
"winter": false,
"file": "30 Hessians.png"
},
"31": {
"id": 31,
"title": "Thomas Brown & the King's Rangers",
"period": "79-80",
"order": [
"british",
"patriots",
"indians",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Tom Brown supports Tories in the South:",
"unshaded": "Place 1 British Fort and 2 Tories in South Carolina or Georgia.",
"shaded_label": "Sons of Liberty rally against:",
"shaded": "Patriots place 2 Militia in South Carolina or Georgia and may Partisans there.",
"winter": false,
"file": "31 Thomas Brown & the King's Rangers.png"
},
"32": {
"id": 32,
"title": "Rule Britannia!",
"period": "75-76",
"order": [
"british",
"patriots",
"indians",
"french"
],
"icons": {
"british": "none",
"indians": "musket",
"patriots": "none",
"french": "none"
},
"unshaded_label": "“Rule, Britannia! rule the waves”:",
"unshaded": "Place up to 2 British Regulars and 2 Tories from Unavailable or Available to any Colony.",
"shaded_label": "“Thy cities shall with commerce shine”:",
"shaded": "Any Faction may add 1 Resource for half the Cities under British Control, rounding down.",
"winter": false,
"file": "32 Rule Britannia.png"
},
"33": {
"id": 33,
"title": "The Burning of Falmouth",
"period": "75-76",
"order": [
"british",
"french",
"indians",
"patriots"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Intimidated Patriots:",
"unshaded": "Patriot Resources –3. Patriots remove 2 Militia.",
"shaded_label": "Patriots outraged over aggressive actions:",
"shaded": "Free Rally in 2 spaces adjacent to Massachusetts. Patriot Resources +3.",
"winter": false,
"file": "33 The Burning of Falmouth.png"
},
"34": {
"id": 34,
"title": "Lord Sandwich, First Lord of the Admiralty",
"period": "77-78",
"order": [
"british",
"french",
"indians",
"patriots"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Captain James Cook sponsored by Sandwich provides know how:",
"unshaded": "British Resources +6. Lower FNI 1 level.",
"shaded_label": "British lack ships to execute in America:",
"shaded": "Raise FNI 1 level. British Ineligible through next card.",
"winter": false,
"file": "34 Lord Sandwich, First Lord of the Admiralty.png"
},
"35": {
"id": 35,
"title": "Tryon Plot",
"period": "75-76",
"order": [
"british",
"french",
"indians",
"patriots"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Governor Tryon's work results in destruction of critical magazines:",
"unshaded": "Remove 2 Patriot pieces in New York or New York City. All Militia there are Activated.",
"shaded_label": "Plot foiled:",
"shaded": "Remove all Tories in New York or in 1 adjacent space.",
"winter": false,
"file": "35 Tryon Plot.png"
},
"36": {
"id": 36,
"title": "Naval Battle in West Indies",
"period": "79-80",
"order": [
"british",
"french",
"indians",
"patriots"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "British Victory at Battle of the Saintes:",
"unshaded": "French remove 3 French Regulars on map or West Indies to Available. Lower FNI 1 level.",
"shaded_label": "French hold their own in the Battle de la Dominique:",
"shaded": "British remove 4 British Regulars from West Indies to Available.",
"winter": false,
"file": "36 Naval Battle in West Indies.png"
},
"37": {
"id": 37,
"title": "The Armada of 1779",
"period": "79-80",
"order": [
"british",
"french",
"patriots",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "French finances impact Patriots:",
"unshaded": "Patriot Resources –2. French Resources –3. Lower FNI 1 level.",
"shaded_label": "British forces distracted from the Colonies:",
"shaded": "Remove 4 British Regulars from the map to Available. Raise FNI 1 level.",
"winter": false,
"file": "37 The Armada of 1779.png"
},
"38": {
"id": 38,
"title": "Johnson's Royal Greens",
"period": "77-78",
"order": [
"british",
"french",
"patriots",
"indians"
],
"icons": {
"british": "none",
"indians": "musket",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Ready for action:",
"unshaded": "British may place 4 British cubes in either Quebec or New York from Unavailable or Available. British Eligible.",
"shaded_label": "Guerrillas rally to answer the Greens:",
"shaded": "Place 3 Militia or 3 War Parties in New York.",
"winter": false,
"file": "38 Johnson's Royal Greens.png"
},
"39": {
"id": 39,
"title": "Gordon Riots",
"period": "79-80",
"order": [
"british",
"french",
"patriots",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "“His Majesty, King Mob” anti-Catholic protests in England damage reputation:",
"unshaded": "Shift 3 Cities 1 level toward Neutral.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "39 Gordon Riots.png"
},
"40": {
"id": 40,
"title": "Battle of the Chesapeake",
"period": "79-80",
"order": [
"british",
"french",
"patriots",
"indians"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "British assert their naval dominance:",
"unshaded": "FNI to 0. British Resources +2.",
"shaded_label": "British fleet distracted from Cities:",
"shaded": "FNI to 3.",
"winter": false,
"file": "40 Battle of the Chesapeake.png"
},
"41": {
"id": 41,
"title": "William Pitt: America Can't Be Conquered",
"period": "75-76",
"order": [
"british",
"indians",
"patriots",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Colonists worry as Pitt's warning is ignored:",
"unshaded": "Shift 2 Colonies 2 levels each toward Passive Support.",
"shaded_label": "Patriots take heart:",
"shaded": "Shift 2 Colonies 2 levels each toward Passive Opposition.",
"winter": false,
"file": "41 William Pitt America Can't Be Conquered.png"
},
"42": {
"id": 42,
"title": "British Attack Danbury",
"period": "77-78",
"order": [
"british",
"indians",
"patriots",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "British take out supply depot:",
"unshaded": "Patriot Resources –3. British place 1 Tory in Connecticut.",
"shaded_label": "Battle of Ridgefield:",
"shaded": "Patriots place 3 Militia and 1 Continental in Connecticut.",
"winter": false,
"file": "42 British Attack Danbury.png"
},
"43": {
"id": 43,
"title": "HMS Russian Merchant with 4,000 Muskets",
"period": "75-76",
"order": [
"british",
"indians",
"patriots",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "HMS Russian Merchant arrives in Charles Town:",
"unshaded": "In up to 3 spaces with a British Regular, the British may add up to 2 Tories per space from Available or Unavailable.",
"shaded_label": "Transport sinks before arrival:",
"shaded": "British remove 1 in 3 Tories, rounding down.",
"winter": false,
"file": "43 HMS Russian Merchant with 4,000 Muskets.png"
},
"44": {
"id": 44,
"title": "Earl of Mansfield Recalled from Paris",
"period": "77-78",
"order": [
"british",
"indians",
"patriots",
"french"
],
"icons": {
"british": "musket",
"indians": "musket",
"patriots": "musket",
"french": "sword"
},
"unshaded_label": "Chaos amongst the diplomats:",
"unshaded": "Any 1 Faction Ineligible through the next card.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "44 Earl of Mansfield Recalled from Paris.png"
},
"45": {
"id": 45,
"title": "Adam Smith ~ Wealth of Nations",
"period": "79-80",
"order": [
"british",
"indians",
"french",
"patriots"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "British intellectuals advance economy:",
"unshaded": "British Resources +6.",
"shaded_label": "Adam Smith's economic case against Imperialism:",
"shaded": "British Resources –4.",
"winter": false,
"file": "45 Adam Smith Wealth of Nations.png"
},
"46": {
"id": 46,
"title": "Edmund Burke on Conciliation",
"period": "75-76",
"order": [
"british",
"indians",
"french",
"patriots"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "“Americans were descended largely from Englishmen”:",
"unshaded": "Place 1 Tory from Unavailable or Available in each of 3 spaces.",
"shaded_label": "“…they bear the burthens of unlimited monopoly”:",
"shaded": "Shift 2 Cities 1 level each toward Passive Opposition.",
"winter": false,
"file": "46 Edmund Burke on Conciliation.png"
},
"47": {
"id": 47,
"title": "Tories Tested",
"period": "77-78",
"order": [
"british",
"indians",
"french",
"patriots"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Tories thrive:",
"unshaded": "Place 3 Tories in 1 Colony with British Control.",
"shaded_label": "Tories flee :",
"shaded": "Replace Tories in 1 Colony with Militia. Place 2 Propaganda there.",
"winter": false,
"file": "47 Tories Tested.png"
},
"48": {
"id": 48,
"title": "God Save the King",
"period": "79-80",
"order": [
"british",
"indians",
"french",
"patriots"
],
"icons": {
"british": "none",
"indians": "sword",
"patriots": "sword",
"french": "sword"
},
"unshaded_label": "“Scatter his enemies”:",
"unshaded": "British free March to 1 space and may free Battle there.",
"shaded_label": "“But be God's mercies known”:",
"shaded": "A non-British Faction moves units from 3 spaces containing British Regulars into any adjacent spaces.",
"winter": false,
"file": "48 God Save the King.png"
},
"49": {
"id": 49,
"title": "Claude Louis, Comte de Saint-Germain",
"period": "75-76",
"order": [
"french",
"patriots",
"british",
"indians"
],
"icons": {
"french": "none",
"patriots": "none",
"british": "none",
"indians": "none"
},
"unshaded_label": "Reforms opposed:",
"unshaded": "Move 5 French Regulars from Available to Unavailable.",
"shaded_label": "Reorganizes Army:",
"shaded": "Move 5 French Regulars from Unavailable to Available.",
"winter": false,
"file": "49 Claude Louise, Comte de Saint-Germain.png"
},
"50": {
"id": 50,
"title": "Admiral d'Estaing, French Fleet Arrives",
"period": "77-78",
"order": [
"french",
"patriots",
"british",
"indians"
],
"icons": {
"french": "none",
"patriots": "none",
"british": "none",
"indians": "none"
},
"unshaded_label": "French poorly coordinate:",
"unshaded": "French are Ineligible and remain Ineligible through next card. Remove 2 French Regulars from West Indies or map to Available.",
"shaded_label": "Well-coordinated French:",
"shaded": "Place 2 Continentals and 2 French Regulars (from Available or West Indies) in any 1 Colony.",
"winter": false,
"file": "50 Admiral d'Estang, French Fleet Arrives.png"
},
"51": {
"id": 51,
"title": "Bermuda Gunpowder Plot",
"period": "75-76",
"order": [
"french",
"patriots",
"british",
"indians"
],
"icons": {
"french": "sword",
"patriots": "musket",
"british": "musket",
"indians": "sword"
},
"unshaded_label": "Gunpowder shortage:",
"unshaded": "British free March to then free Battle in 1 space. –2 to Attacker's Loss Level.",
"shaded_label": "Gunpowder aplenty:",
"shaded": "Patriots free March to then free Battle in 1 space. +2 to Defender's Loss Level.",
"winter": false,
"file": "51 Bermuda Gunpowder Plot.png"
},
"52": {
"id": 52,
"title": "French Fleet Arrives in the Wrong Spot",
"period": "79-80",
"order": [
"french",
"patriots",
"british",
"indians"
],
"icons": {
"french": "musket",
"patriots": "musket",
"british": "musket",
"indians": "sword"
},
"unshaded_label": "Coordination with the French is a challenge:",
"unshaded": "Remove up to 4 French Regulars from the map to Available. Free Battle anywhere with +2 Force Level.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "52 French Fleet Arrives in the Wrong Spot.png"
},
"53": {
"id": 53,
"title": "French Ports Accept Patriot's Ships",
"period": "75-76",
"order": [
"french",
"patriots",
"indians",
"british"
],
"icons": {
"french": "none",
"patriots": "none",
"indians": "none",
"british": "none"
},
"unshaded_label": "Backlash against French:",
"unshaded": "British Resources +3. Lower FNI 2 levels.",
"shaded_label": "Extended range of privateers impacts shipping:",
"shaded": "British Resources –2. Patriot Resources +2. Raise FNI 1 level.",
"winter": false,
"file": "53 French Ports Accept Patriot's Ships.png"
},
"54": {
"id": 54,
"title": "Antoine de Sartine, Secretary of the Navy",
"period": "75-76",
"order": [
"french",
"patriots",
"indians",
"british"
],
"icons": {
"french": "none",
"patriots": "none",
"indians": "none",
"british": "none"
},
"unshaded_label": "Fuels establishment pushback:",
"unshaded": "Move 1 Squadron/Blockade from West Indies to Unavailable.",
"shaded_label": "Rationalizes the French Navy:",
"shaded": "Move 2 Squadrons/Blockades from Unavailable to West Indies.",
"winter": false,
"file": "54 Antoine de Sartine, Secretary of the Navy.png"
},
"55": {
"id": 55,
"title": "French Navy Dominates Caribbean",
"period": "77-78",
"order": [
"french",
"patriots",
"indians",
"british"
],
"icons": {
"french": "none",
"patriots": "none",
"indians": "none",
"british": "none"
},
"unshaded_label": "French reinforce their success:",
"unshaded": "Move 3 French Regulars from map to West Indies. French may free Battle in West Indies. Lower FNI 1 level.",
"shaded_label": "British fight back:",
"shaded": "Move any 4 British Regulars from map to West Indies. British must free Battle there.",
"winter": false,
"file": "55 French Navy Dominates Caribbean.png"
},
"56": {
"id": 56,
"title": "Jacques Turgot's Economic Liberalism",
"period": "75-76",
"order": [
"french",
"patriots",
"indians",
"british"
],
"icons": {
"french": "none",
"patriots": "none",
"indians": "none",
"british": "none"
},
"unshaded_label": "As minister of the Navy, opposed support for Patriots:",
"unshaded": "Patriot Resources –3.",
"shaded_label": "Believes in the virtue of the American cause:",
"shaded": "Patriot Resources + 3.",
"winter": false,
"file": "56 Jacques Turgot's Economic Liberalism.png"
},
"57": {
"id": 57,
"title": "French Fleet Sails for the Caribbean",
"period": "79-80",
"order": [
"french",
"british",
"indians",
"patriots"
],
"icons": {
"french": "none",
"british": "none",
"indians": "none",
"patriots": "none"
},
"unshaded_label": "French focus away from the Colonies:",
"unshaded": "Move 2 French Regulars from Available to the West Indies. French Ineligible through the next card. Lower FNI 1 level.",
"shaded_label": "French battle in Grenada:",
"shaded": "Move 2 British Regulars from map to West Indies. British Ineligible through the next card.",
"winter": false,
"file": "57 French Fleet Sails for the Carribean.png"
},
"58": {
"id": 58,
"title": "Marquis de Lafayette Arrives in Colonies",
"period": "77-78",
"order": [
"french",
"british",
"indians",
"patriots"
],
"icons": {
"french": "none",
"british": "none",
"indians": "none",
"patriots": "none"
},
"unshaded_label": "Lafayette's arrival upsets King Louis XVI:",
"unshaded": "Patriot Resources –4.",
"shaded_label": "Lafayette leads Patriots North:",
"shaded": "In New York, Quebec and Northwest replace Tories with Patriot Militia.",
"winter": false,
"file": "58 Marquis de Lafayette Arrives in Colonies.png"
},
"59": {
"id": 59,
"title": "Tronson du Coudray Arrives in America",
"period": "77-78",
"order": [
"french",
"british",
"indians",
"patriots"
],
"icons": {
"french": "none",
"british": "none",
"indians": "none",
"patriots": "none"
},
"unshaded_label": "Arrogance damages coordination:",
"unshaded": "Remove 2 Continentals and 2 French Regulars from 1 space to Available.",
"shaded_label": "Drowns in the Schuylkill River:",
"shaded": "Patriot Resources +3.",
"winter": false,
"file": "59 Tronson du Coudray Arrives in America.png"
},
"60": {
"id": 60,
"title": "Comte d'Orvilliers Builds a Fleet at Brest",
"period": "77-78",
"order": [
"french",
"british",
"indians",
"patriots"
],
"icons": {
"french": "none",
"british": "none",
"indians": "none",
"patriots": "none"
},
"unshaded_label": "British are prepared:",
"unshaded": "Lower FNI 2 levels. French Resources –4.",
"shaded_label": "Challenges British naval dominance:",
"shaded": "Raise FNI 1 level. British Resources –3.",
"winter": false,
"file": "60 Comte d'Orvilliers Builds a Fleet at Brest.png"
},
"61": {
"id": 61,
"title": "Minister Comte de Vergennes",
"period": "77-78",
"order": [
"french",
"british",
"patriots",
"indians"
],
"icons": {
"french": "none",
"british": "none",
"patriots": "none",
"indians": "none"
},
"unshaded_label": "Patriots distracted by French priorities:",
"unshaded": "Patriots Ineligible through the next card.",
"shaded_label": "Minister favors the Colonies:",
"shaded": "Patriot Resources +3. French Resources +2.",
"winter": false,
"file": "61 Minister Comte de Vergennes.png"
},
"62": {
"id": 62,
"title": "Charles Michel de Langlade",
"period": "79-80",
"order": [
"french",
"british",
"patriots",
"indians"
],
"icons": {
"french": "musket",
"british": "musket",
"patriots": "none",
"indians": "none"
},
"unshaded_label": "Assists the British:",
"unshaded": "Place 3 War Parties or 3 Tories in New York, Quebec or Northwest.",
"shaded_label": "Patriots and French rally to fight:",
"shaded": "Place 3 French Regulars in Quebec or 3 Militia in Northwest.",
"winter": false,
"file": "62 Charles Michel de Langlade.png"
},
"63": {
"id": 63,
"title": "French and Spanish Besiege Gibraltar",
"period": "77-78",
"order": [
"french",
"british",
"patriots",
"indians"
],
"icons": {
"french": "none",
"british": "none",
"patriots": "none",
"indians": "none"
},
"unshaded_label": "British weather the storm:",
"unshaded": "British Resources +1. Lower FNI 1 level. Remove 2 British Regulars from West Indies to Available.",
"shaded_label": "British struggle to defend:",
"shaded": "British Resources –5.",
"winter": false,
"file": "63 French and Spanish Besiege Gibraltar.png"
},
"64": {
"id": 64,
"title": "The Affair of Fielding and Bylandt",
"period": "79-80",
"order": [
"french",
"british",
"patriots",
"indians"
],
"icons": {
"french": "none",
"british": "none",
"patriots": "none",
"indians": "none"
},
"unshaded_label": "British seize Dutch contraband:",
"unshaded": "British Resources +3. Lower FNI 1 level.",
"shaded_label": "Dutch avoid seizure and provide resources to Patriots:",
"shaded": "Patriot Resources +5.",
"winter": false,
"file": "64 The Affair of Fielding and Bylandt.png"
},
"65": {
"id": 65,
"title": "Jacques Necker, Finance Minister",
"period": "79-80",
"order": [
"french",
"indians",
"british",
"patriots"
],
"icons": {
"french": "none",
"indians": "none",
"british": "none",
"patriots": "sword"
},
"unshaded_label": "War is expensive for French:",
"unshaded": "French Resources –4.",
"shaded_label": "War is pricey, but resources allocated to America:",
"shaded": "French Resources +3.",
"winter": false,
"file": "65 Jacques Necker, Finance Minister.png"
},
"66": {
"id": 66,
"title": "Don Bernardo Takes Pensacola",
"period": "79-80",
"order": [
"french",
"indians",
"british",
"patriots"
],
"icons": {
"french": "none",
"indians": "none",
"british": "sword",
"patriots": "none"
},
"unshaded_label": "British reinforce the lower Mississippi River Valley:",
"unshaded": "Place 6 British cubes in either Florida or Southwest.",
"shaded_label": "Led Spanish forces against the British:",
"shaded": "French or Patriots free March to and free Battle in Florida with a +2 Force Level.",
"winter": false,
"file": "66 Don Bernardo Takes Pensacola.png"
},
"67": {
"id": 67,
"title": "De Grasse Arrives with the French Fleet",
"period": "79-80",
"order": [
"french",
"indians",
"british",
"patriots"
],
"icons": {
"french": "none",
"indians": "none",
"british": "none",
"patriots": "none"
},
"unshaded_label": "Balances effort in West Indies:",
"unshaded": "Lower FNI 1 level. Remove 3 French Regulars from West Indies to Available.",
"shaded_label": "French coordination in North America:",
"shaded": "French or Patriots free Rally or Muster in 1 space and remain or become Eligible.",
"winter": false,
"file": "67 De Grasse Arrives with the French Fleet.png"
},
"68": {
"id": 68,
"title": "French in America Want Canada",
"period": "75-76",
"order": [
"french",
"indians",
"british",
"patriots"
],
"icons": {
"french": "sword",
"indians": "sword",
"british": "sword",
"patriots": "none"
},
"unshaded_label": "Invasion Canada:",
"unshaded": "Relocate up to 6 of the executing Faction's cubes on map to Quebec and place 1 friendly Fort there from Available.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "68 French in America Want Canada.png"
},
"69": {
"id": 69,
"title": "Admiral Pierre André de Suffren",
"period": "77-78",
"order": [
"french",
"indians",
"patriots",
"british"
],
"icons": {
"french": "none",
"indians": "none",
"patriots": "none",
"british": "none"
},
"unshaded_label": "Sent to India to assist:",
"unshaded": "Lower FNI 2 levels. British Resources + 2.",
"shaded_label": "Squadron isolation strategy has great success:",
"shaded": "Raise FNI 1 level. French Resources +3.",
"winter": false,
"file": "69 Admiral Pierre Andre de Suffren.png"
},
"70": {
"id": 70,
"title": "British Gain from French in India",
"period": "79-80",
"order": [
"french",
"indians",
"patriots",
"british"
],
"icons": {
"french": "musket",
"indians": "musket",
"patriots": "musket",
"british": "musket"
},
"unshaded_label": "Conflict in India impacts the war:",
"unshaded": "Remove 3 Regulars from map or West Indies to Available.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "70 British Gain from French in India.png"
},
"71": {
"id": 71,
"title": "Treaty of Amity and Commerce",
"period": "77-78",
"order": [
"french",
"indians",
"patriots",
"british"
],
"icons": {
"french": "none",
"indians": "sword",
"patriots": "musket",
"british": "sword"
},
"unshaded_label": "Patriots receive financial benefit:",
"unshaded": "Add population of Cities under Rebellion Control to Patriot Resources.",
"shaded_label": "French benefit economically from commercial treaty with the Colonies:",
"shaded": "French Resources +5.",
"winter": false,
"file": "71 Treaty of Amity and Commerce.png"
},
"72": {
"id": 72,
"title": "French Settlers Help",
"period": "75-76",
"order": [
"french",
"indians",
"patriots",
"british"
],
"icons": {
"french": "none",
"indians": "musket",
"patriots": "none",
"british": "sword"
},
"unshaded_label": "French settlers impact the war:",
"unshaded": "Place 1 friendly Fort or Village and 3 friendly Militia, War Parties or cubes in any 1 Indian Reserve Province.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "72 French Settlers Help.png"
},
"73": {
"id": 73,
"title": "Sullivan Expedition vs. Iroquois and Tories",
"period": "79-80",
"order": [
"indians",
"patriots",
"british",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "musket"
},
"unshaded_label": "Raids:",
"unshaded": "Remove 1 Fort or Village in New York, Northwest, or Quebec.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "73 Sullivan Expedition vs Iroquois and Tories.png"
},
"74": {
"id": 74,
"title": "Chickasaw Ally with the British",
"period": "77-78",
"order": [
"indians",
"patriots",
"british",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "sword"
},
"unshaded_label": "Benefit from the alliance:",
"unshaded": "Indians or British add 1 Resource for every 2 Indian Villages on map.",
"shaded_label": "Battles in the back country:",
"shaded": "In each of 2 spaces, remove 1 War Party and 2 Militia or 1 Militia and 2 War Parties.",
"winter": false,
"file": "74 Chickasaw Ally with the British.png"
},
"75": {
"id": 75,
"title": "Congress' Speech to the Six Nations",
"period": "75-76",
"order": [
"indians",
"patriots",
"british",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "sword"
},
"unshaded_label": "Take up hatchets for King's Troops:",
"unshaded": "Indians free Gather in 3 Indian Reserve Provinces then free War Path in 1 of those spaces.",
"shaded_label": "Colonial backlash:",
"shaded": "Remove 3 Indian pieces from Northwest (Villages last).",
"winter": false,
"file": "75 Congress' Speech to the Six Nations.png"
},
"76": {
"id": 76,
"title": "Edward Hand Raids into Indian Country",
"period": "77-78",
"order": [
"indians",
"patriots",
"british",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "sword"
},
"unshaded_label": "Three key lieutenants defect:",
"unshaded": "British replace 3 Militia with 3 Tories in 1 Province.",
"shaded_label": "“Squaw Campaign” Patriots intimidate Indians:",
"shaded": "British remove 2 Villages.",
"winter": false,
"file": "76 Edward Hand Raids into Indian Country.png"
},
"77": {
"id": 77,
"title": "General Burgoyne Cracks Down",
"period": "77-78",
"order": [
"indians",
"patriots",
"french",
"british"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "sword"
},
"unshaded_label": "Indians respond positively:",
"unshaded": "Indians place 1 Village in 1 space with British and Indian pieces. All War Parties on the map to Underground.",
"shaded_label": "Indian backlash:",
"shaded": "Remove 1 British piece in 3 Provinces shared with Indians (Forts last). Place 1 Raid marker in each space.",
"winter": false,
"file": "77 General Burgoyne Cracks Down.png"
},
"78": {
"id": 78,
"title": "Cherry Valley Destroyed by Tories",
"period": "77-78",
"order": [
"indians",
"patriots",
"french",
"british"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Patriots intimidated:",
"unshaded": "Patriots remove ¼ of their total units on map, rounding down.",
"shaded_label": "Patriots rally against Tories and Indians:",
"shaded": "Add 1 Patriot Militia in 4 spaces with a Tory or Indian piece.",
"winter": false,
"file": "78 Cherry Valley Destroyed by Tories.png"
},
"79": {
"id": 79,
"title": "Tuscarora and Oneida Come to Washington",
"period": "79-80",
"order": [
"indians",
"patriots",
"french",
"british"
],
"icons": {
"british": "sword",
"indians": "none",
"patriots": "none",
"french": "sword"
},
"unshaded_label": "Rally with the Patriots:",
"unshaded": "Place 1 Village and 2 War Parties in 1 Colony.",
"shaded_label": "Other tribes rally against:",
"shaded": "Remove 1 Village and 2 War Parties in 1 Colony.",
"winter": false,
"file": "79 Tuscarora and Oneida Come to Washington.png"
},
"80": {
"id": 80,
"title": "Confusion Allows Slaves to Escape",
"period": "77-78",
"order": [
"indians",
"patriots",
"french",
"british"
],
"icons": {
"british": "musket",
"indians": "musket",
"patriots": "musket",
"french": "sword"
},
"unshaded_label": "Change in the midst of chaos:",
"unshaded": "Select 1 Faction. That Faction must remove 2 of its own pieces in each of 2 spaces.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "80 Confusion Allows Slaves to Escape.png"
},
"81": {
"id": 81,
"title": "Creek and Seminole Active in South",
"period": "79-80",
"order": [
"indians",
"british",
"patriots",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Increased Indian activity:",
"unshaded": "Place 2 War Parties, 1 Raid marker, and 1 Village in South Carolina or Georgia.",
"shaded_label": "Indians challenged:",
"shaded": "Remove 2 War Parties total in South Carolina and/or Georgia.",
"winter": false,
"file": "81 Creek and Seminole Active in South.png"
},
"82": {
"id": 82,
"title": "Frustrated Shawnee Warriors Attack",
"period": "75-76",
"order": [
"indians",
"british",
"patriots",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Raiding parties in the South:",
"unshaded": "Indians place a War Party and Raid marker in VA, GA, NC and SC.",
"shaded_label": "Colonies backlash:",
"shaded": "Remove 3 Indian pieces total from VA, GA, NC and/or SC (Villages last).",
"winter": false,
"file": "82 Frustrated Shawnee Warriors Attack.png"
},
"83": {
"id": 83,
"title": "Guy Carleton and Indians Negotiate",
"period": "75-76",
"order": [
"indians",
"british",
"patriots",
"french"
],
"icons": {
"british": "none",
"indians": "musket",
"patriots": "musket",
"french": "musket"
},
"unshaded_label": "Quebec alignment:",
"unshaded": "Shift Quebec City to Active Support. Place 2 War Parties in Quebec.",
"shaded_label": "Quebec chaos:",
"shaded": "Place up to 3 pieces (no more than 1 Fort or Village) in either Quebec or Quebec City.",
"winter": false,
"file": "83 Guy Carleton and Indians Negotiate.png"
},
"84": {
"id": 84,
"title": "“Merciless Indian Savages”",
"period": "75-76",
"order": [
"indians",
"british",
"patriots",
"french"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "sword"
},
"unshaded_label": "Indians encroach on the Colonies:",
"unshaded": "Indians free Gather in 2 Colonies.",
"shaded_label": "Indians are attacked after the Declaration of Independence:",
"shaded": "Patriots remove 1 Village.",
"winter": false,
"file": "84 Merciless Indian Savages.png"
},
"85": {
"id": 85,
"title": "Indians Help British Raids on Mississippi",
"period": "79-80",
"order": [
"indians",
"british",
"french",
"patriots"
],
"icons": {
"british": "sword",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Increases force level:",
"unshaded": "British place a total of 3 British Regulars and/or Tories in Southwest.",
"shaded_label": "Patriots rally against British and Indians:",
"shaded": "Place 2 Militia or Continentals and 2 French Regulars in Southwest.",
"winter": false,
"file": "85 Indians Help British Raids on Mississippi.png"
},
"86": {
"id": 86,
"title": "Stockbridge Indians",
"period": "75-76",
"order": [
"indians",
"british",
"french",
"patriots"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "musket",
"french": "none"
},
"unshaded_label": "Fight the Colonists:",
"unshaded": "Activate all Militia in Massachusetts or in any 1 space with an Indian piece.",
"shaded_label": "Join the Colonists:",
"shaded": "Add 3 Militia in Massachusetts or any 1 space with an Indian piece.",
"winter": false,
"file": "86 Stockbridge Indians.png"
},
"87": {
"id": 87,
"title": "Patriots Massacre Lenape Indians",
"period": "79-80",
"order": [
"indians",
"british",
"french",
"patriots"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Gnadenhütten Massacre:",
"unshaded": "Remove 1 piece in Pennsylvania. Remain Eligible.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "87 Patriots Massacre Lenape Indians.png"
},
"88": {
"id": 88,
"title": "“If it hadn’t been so foggy…”",
"period": "77-78",
"order": [
"indians",
"british",
"french",
"patriots"
],
"icons": {
"british": "musket",
"indians": "musket",
"patriots": "musket",
"french": "musket"
},
"unshaded_label": "Fog allows disengagement:",
"unshaded": "Select 1 Faction. Move any own units sharing a space with that Faction to adjacent spaces.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "88 If it hadn't been so foggy.png"
},
"89": {
"id": 89,
"title": "War Damages Colonies’ Economy",
"period": "77-78",
"order": [
"indians",
"french",
"british",
"patriots"
],
"icons": {
"british": "none",
"indians": "musket",
"patriots": "none",
"french": "musket"
},
"unshaded_label": "Patriots turn against the Continental Congress:",
"unshaded": "Replace any 4 Militia or Continentals with Tories.",
"shaded_label": "Patriots hunker down and redouble efforts to support war:",
"shaded": "Replace any 3 Tories with Patriot Militia.",
"winter": false,
"file": "89 War Damages Colonies' Economy.png"
},
"90": {
"id": 90,
"title": "“The World Turned Upside Down”",
"period": "75-76",
"order": [
"indians",
"french",
"british",
"patriots"
],
"icons": {
"british": "none",
"indians": "musket",
"patriots": "musket",
"french": "none"
},
"unshaded_label": "“Till then upon Ararat’s hill”:",
"unshaded": "Place 1 friendly Fort or Village.",
"shaded_label": "British surrender anthem:",
"shaded": "Remove 2 British Regulars on map to Casualties.",
"winter": false,
"file": "90 The World Turned Upside Down.png"
},
"91": {
"id": 91,
"title": "Indians Help British Outside Colonies",
"period": "75-76",
"order": [
"indians",
"french",
"british",
"patriots"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "sword"
},
"unshaded_label": "Indians assisted:",
"unshaded": "Place 1 Village and 2 War Parties in 1 Indian Reserve Province.",
"shaded_label": "Indians need assistance:",
"shaded": "Remove 1 Village in 1 Indian Reserve Province.",
"winter": false,
"file": "91 Indians Help British Outside Colonies.png"
},
"92": {
"id": 92,
"title": "Cherokees Supplied by the British",
"period": "75-76",
"order": [
"indians",
"french",
"british",
"patriots"
],
"icons": {
"british": "sword",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Grow in strength:",
"unshaded": "Place a second Fort or Village in a space where you have 1.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "92 Cherokees Supplied by the British.png"
},
"93": {
"id": 93,
"title": "Wyoming Massacre",
"period": "77-78",
"order": [
"indians",
"french",
"patriots",
"british"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Indians intimidate on the frontier:",
"unshaded": "Shift up to 3 Colonies adjacent to an Indian Reserve Province 1 level toward Neutral. Place 1 Raid marker in each.",
"shaded_label": "Patriot backlash:",
"shaded": "Remove 4 War Parties in or adjacent to Pennsylvania.",
"winter": false,
"file": "93 Wyoming Massacre.png"
},
"94": {
"id": 94,
"title": "Herkimer’s Relief Column",
"period": "79-80",
"order": [
"indians",
"french",
"patriots",
"british"
],
"icons": {
"british": "none",
"indians": "none",
"patriots": "none",
"french": "none"
},
"unshaded_label": "Tories and Indians ambush:",
"unshaded": "Indians free Gather and Tories free Muster in New York. Remove all Militia from New York.",
"shaded_label": "Tory and Indian camp sacked:",
"shaded": "Remove all Indian pieces from New York.",
"winter": false,
"file": "94 Herkimer's Relief Column.png"
},
"95": {
"id": 95,
"title": "Ohio Country Frontier Erupts",
"period": "79-80",
"order": [
"indians",
"french",
"patriots",
"british"
],
"icons": {
"british": "musket",
"indians": "none",
"patriots": "none",
"french": "musket"
},
"unshaded_label": "Attacks and backlash:",
"unshaded": "In Northwest, remove any 1 enemy Fort or Village and place 3 friendly units.",
"shaded_label": null,
"shaded": null,
"winter": false,
"file": "95 Ohio Country Frontier Erupts.png"
},
"96": {
"id": 96,
"title": "Iroquois Confederacy",
"period": "79-80",
"order": [
"indians",
"french",
"patriots",
"british"
],
"icons": {
"british": "sword",
"indians": "none",
"patriots": "none",
"french": "sword"
},
"unshaded_label": "Iroquois Confederacy reconstitutes:",
"unshaded": "Indians free Gather and War Path in 2 Indian Reserve Provinces.",
"shaded_label": "Iroquois Confederacy shatters:",
"shaded": "Remove 1 Indian Village.",
"winter": false,
"file": "96 Iroquois Confederacy.png"
},
"97": {
"id": 97,
"title": "Winter Quarters",
"period": null,
"order": null,
"icons": null,
"unshaded_label": "Royals commit:",
"unshaded": "If CRC > CBC, French Resources +5, else British Resources +5 during Reset Phase.",
"shaded_label": null,
"shaded": null,
"winter": true,
"file": "97 Winter Quarters.png"
},
"98": {
"id": 98,
"title": "Winter Quarters",
"period": null,
"order": null,
"icons": null,
"unshaded_label": "Overconfident at home:",
"unshaded": "If CRC > CBC, British Resources –3, else French Resources –3 during Reset Phase.",
"shaded_label": null,
"shaded": null,
"winter": true,
"file": "98 Winter Quarters.png"
},
"99": {
"id": 99,
"title": "Winter Quarters",
"period": null,
"order": null,
"icons": null,
"unshaded_label": "West Indies conflict goes the other way:",
"unshaded": "Reduce the larger of CRC or CBC by half the difference (rounding down) during Reset Phase.",
"shaded_label": null,
"shaded": null,
"winter": true,
"file": "99 Winter Quarters.png"
},
"100": {
"id": 100,
"title": "Winter Quarters",
"period": null,
"order": null,
"icons": null,
"unshaded_label": "India conflict goes the other way:",
"unshaded": "Reduce the larger of CRC or CBC by half the difference (rounding down) during Reset Phase.",
"shaded_label": null,
"shaded": null,
"winter": true,
"file": "100 Winter Quarters.png"
},
"101": {
"id": 101,
"title": "Winter Quarters",
"period": null,
"order": null,
"icons": null,
"unshaded_label": "Floods shift the balance:",
"unshaded": "If Patriots or Indians are ahead in their second victory condition (7.2), that Faction loses 2 Resources during Reset Phase.",
"shaded_label": null,
"shaded": null,
"winter": true,
"file": "101 Winter Quarters.png"
},
"102": {
"id": 102,
"title": "Winter Quarters",
"period": null,
"order": null,
"icons": null,
"unshaded_label": "War on the frontier:",
"unshaded": "If Patriots or Indians are ahead in their second victory condition (7.2), that Faction removes 1 of its Forts or Villages during Reset Phase.",
"shaded_label": null,
"shaded": null,
"winter": true,
"file": "102 Winter Quarters.png"
},
"103": {
"id": 103,
"title": "Winter Quarters",
"period": null,
"order": null,
"icons": null,
"unshaded_label": "Severe Winter:",
"unshaded": "If Patriots or Indians are ahead in their second victory condition (7.2), that Faction removes 1 of its Forts or Villages during Reset Phase.",
"shaded_label": null,
"shaded": null,
"winter": true,
"file": "103 Winter Quarters.png"
},
"104": {
"id": 104,
"title": "Winter Quarters",
"period": null,
"order": null,
"icons": null,
"unshaded_label": "Hurricane hits the South:",
"unshaded": "If Patriots or Indians are ahead in their second victory condition (7.2), that Faction loses 2 Resources during Reset Phase.",
"shaded_label": null,
"shaded": null,
"winter": true,
"file": "104 Winter Quarters.png"
}
};
const LOD=(typeof module!=='undefined'&&module.exports)?require('./wq.js'):root.LOD;LOD.CARDS=CARDS;if(typeof module!=='undefined'&&module.exports)module.exports=LOD;})(typeof window!=='undefined'?window:globalThis);
