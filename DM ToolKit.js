const DMToolKit = (() => {
    // BAR CONFIGURATION -- Set to 0 to disable. Cannot use same bar # twice.
    const ARMOR_CLASS_BAR        = 1;
    const HIT_POINT_BAR          = 3;
    const PASSIVE_PERCEPTION_BAR = 2;
    const SPEED_BAR              = 0;
    
    // USER CONFIGURATION -- Set to true/false or hex color code.
    const ANNOUNCE_NEW_TURN     = true;
    const CHECK_INSTANT_DEATH   = true;
    const CHECK_SYSTEM_SHOCK    = false;
    const NPC_COLOR             = "#444444";
    const PC_COLOR              = "#073763";
    const PULL_GM_TO_TOKEN      = true;
    const RANDOM_NPC_HP         = true;
    const SHOW_GREEN_DOT        = true;
    const SHOW_HALF_HITPOINTS   = true;
    const SHOW_NPC_HITPOINTS    = false;
    const SHOW_NPC_NAMES        = true;
    const SHOW_NPC_STATBLOCK    = true;
    const USE_PLAYER_COLOR      = true;
    
    // FLOATING DAMAGE CONFIGURATION
    const barValueKey = `bar${HIT_POINT_BAR}_value`;
    const barMaxKey = `bar${HIT_POINT_BAR}_max`;
    const config = {
        enabled: true,
        font: 'Contrail One',
        fontSize: 32,
        damageColor: '#FF0000',
        healingColor: '#00FF00',
        tokenSizeScaling: true,
        majorDamageScaling: true
    };
    
    // VERSION INFORMATION
    const DMToolkit_Author = "Sky";
    const DMToolkit_Version = "4.5.5"; // Adjusted npc statblock on turn order, removed actions
    const DMToolkit_LastUpdated = 1561178746;
    
	// FUNCTIONS
	const adjustTokenHP = function(Command, Amount, Token) {
        // VARIABLES
        let HP_Current = parseInt(Token.get(`bar${HIT_POINT_BAR}_value`));
        let HP_Max = parseInt(Token.get(`bar${HIT_POINT_BAR}_max`));
        let Previous = JSON.parse(JSON.stringify(Token));
        
        if (isNaN(HP_Current) || isNaN(HP_Max)) return;
        sendChat("", "/r " + Amount, function (roll) {
            let Result = Math.abs(parseInt(JSON.parse(roll[0].content).total));
            let Character = (Token.get("represents") !== "") ? getObj("character", Token.get("represents")) : "";
            let isNPC = (Character !== "") ? Boolean(Number(getAttrByName(Character.id, "npc"))) : true;
            let TokenName = ((isNPC && SHOW_NPC_NAMES) || isNPC === false) ? Token.get("name") : "NPC";
            let Message = "";
            let BGColor = "#000";
            if (Command == "!heal") {
                Token.set(`bar${HIT_POINT_BAR}_value`, HP_Current += (Result + HP_Current > HP_Max) ? HP_Max - HP_Current : Result);
                Message = TokenName + " heals " + Result + " hit point" + ((Result === 1) ? "." : "s.");
                BGColor = "#040";
            } else if (Command == "!damage") {
                Token.set(`bar${HIT_POINT_BAR}_value`, HP_Current -= (HP_Current < Result) ? HP_Current : Result);
                Message = `${TokenName} takes ${Result} damage.`;
                BGColor = "#400";
            }
            let OuterStyle = `width: 100%; margin: 0px 0px 0px -7px; padding: 0px`;
            let InnerStyle = `line-height: 20px; width: 100%; margin: 0px; padding: 0px 0px 2px 7px; clear: both; overflow: hidden; font-family: Candal; font-weight: lighter; font-size: 13px; color: #FFF; background-color: ${BGColor}; background-image: linear-gradient(rgba(255, 255, 255, .4), rgba(255, 255, 255, 0)); border: 1px solid #000; border-radius: 4px; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, -1px -1px 0 #000;`;
            sendChat("", `/desc <div style='${OuterStyle}'><div style='${InnerStyle}'>${Message}</div></div>`);
            if ("undefined" !== typeof handleTokenHPChange) handleTokenHPChange(Token, Previous);
            if ("undefined" !== typeof HealthColors && HealthColors.Update) HealthColors.Update(Token, Previous);
            if ("undefined" !== typeof ApplyDamage) onTokenChange(Token, Previous);
        });
	}
	const announceNewTurn = function(current, previous) {
        if (_.isEmpty(current) || _.isEmpty(previous)) return;
        if (current[0].id !== "-1" && current[0].id !== previous[0].id && getObj("graphic", current[0].id).get("layer") !== "gmlayer" && current[0].id !== previous[0].id) {
            let Token = getObj("graphic", current[0].id);
            let Character = (Token.get("represents") !== "") ? getObj("character", Token.get("represents")) : "";
            let ControlledBy = (Character !== "" && Character !== undefined) ? Character.get("controlledby") : "";
            let Player = (ControlledBy !== "" && ControlledBy.startsWith("-")) ? Character.get("controlledby").split(",")[0] : (ControlledBy !== "" && ControlledBy.startsWith("all,")) ? Character.get("controlledby").split(",")[1] : "";
            let isNPC = (Character !== "" && Character !== undefined) ? Boolean(Number(getAttrByName(Character.id, "npc"))) : true;
            let Message = ((isNPC && SHOW_NPC_NAMES) || isNPC === false) ? (Token.get("name").startsWith("Round")) ? Token.get("name") + " " + current[0].pr : Token.get("name") : "NPC";
            let BGColor = (Token.get("name") === "Round") ? "#000000": (isNPC) ? NPC_COLOR : (USE_PLAYER_COLOR && Player !== "") ? getObj("player", Player).get("color") : PC_COLOR;
            let TXColor = (getBrightness(BGColor) < (255 / 2)) ? "#FFF" : "#000";
            let TXShadow = (TXColor == "#000") ? "#FFF" : "#000";
            let OuterStyle = `line-height: 40px; max-height: 40px; width: 100%; margin: 11px 0px 5px -7px; padding: 0px`;
            let InnerStyle = `clear: both; overflow: hidden; line-height: 20px; max-height: 20px; width: 100%; margin: 0px; padding: 0px 0px 2px 0px; font-family: Candal; font-weight: lighter; font-size: 13px; color: ${TXColor}; background-color: ${BGColor}; background-image: linear-gradient(rgba(255, 255, 255, .4), rgba(255, 255, 255, 0)); border: 1px solid #000; border-radius: 4px; text-shadow: -1px -1px 0 ${TXShadow}, 1px -1px 0 ${TXShadow}, -1px 1px 0 ${TXShadow}, -1px -1px 0 ${TXShadow};`;
            let Avatar = (Token !== undefined && Token.get("type") === "graphic") ? `<img src='` + Token.get("imgsrc") + `' style='float: right; height: 40px; width: 40px; margin: -32px -10px 0px 0px;'></img>` : "";
            let AbilityStyle = "display: inline-block; width: 33%; text-align: center; font-family: Candal; font-size: 13px;";
            sendChat("", `/desc <div style='${OuterStyle}'><div style='${InnerStyle}'><span style='padding-right: 20px;'>${Message}</span></div>${Avatar}</div>`);
            if (SHOW_NPC_STATBLOCK && isNPC && Character !== "" && Character !== undefined) sendChat("DM ToolKit", `/w GM &{template:traits} {{description=<span style="font-family: Candal; font-size: 13px;">**Speed:** ${getAttrByName(Character.id, "npc_speed").replace("ft.", "ft")}<br>**Senses:** ${getAttrByName(Character.id, "npc_senses").replace("blindsight", "Blindsight").replace("darkvision", "Darkvision").replace("passive", "Passive").replace(" , ", "").replace("ft.", "ft")}</span>}}`);
            // **Ability Scores:**<div style='1px solid #000;'><div style='${AbilityStyle}'>STR ${getAttrByName(Character.id, "strength")}</div><div style='${AbilityStyle}'>DEX ${getAttrByName(Character.id, "dexterity")}</div><div style='${AbilityStyle}'>CON ${getAttrByName(Character.id, "constitution")}</div></div><div style='1px solid #000;'><div style='${AbilityStyle}'>INT ${getAttrByName(Character.id, "intelligence")}</div><div style='${AbilityStyle}'>WIS ${getAttrByName(Character.id, "wisdom")}</div><div style='${AbilityStyle}'>CHA ${getAttrByName(Character.id, "charisma")}</div></div>
        }
	}
	const damageNumber = function(token, hpChange, hpPrevious, hpCurrent, hpMax) {
        let width = token.get('width');
        let height = token.get('height');
        let fontSize = scaleFont(height, width, hpChange, hpPrevious, hpCurrent, hpMax);
        let floating_number = createObj('text', {
            _pageid: token.get('_pageid'),
            layer: token.get('layer'),
            left: token.get('left') - width * 0.4 + Math.floor(Math.random() * (width * 0.8)),
            top: token.get('top') - height / 2 + Math.floor(Math.random() * 20),
            text: Math.abs(hpChange).toString(),
            font_family: config.font,
            font_size: fontSize,
            color: hpCurrent > hpPrevious ? config.healingColor : config.damageColor
        });
        
        updateDamageNumber(floating_number, floating_number.get('top') - 50, 20);
    }
	const enforceDefaults = function(attr) {
	    // log (attr);
	    if (attr.get("name") == "rtype") attr.set("current", "{{always=1}} {{r2=[[@{d20}");
	    if (attr.get("name") == "init_tiebreaker") attr.set("current", "0");
	}
	const getBrightness = function(hex) {
        hex = hex.replace('#', '');
        let c_r = getHex2Dec(hex.substr(0, 2));
        let c_g = getHex2Dec(hex.substr(2, 2));
        let c_b = getHex2Dec(hex.substr(4, 2));
        return ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
	}
    const getHex2Dec = function(hex_string) {
        hex_string = (hex_string + '').replace(/[^a-f0-9]/gi, '');
        return parseInt(hex_string, 16);
    }
    const handleDeletedToken = function (obj) {
        if (JSON.parse(Campaign().get("turnorder")).length > 0) {
            var Previous = JSON.parse(JSON.stringify(Campaign()));
            var TurnOrder = _.reject(JSON.parse(Campaign().get("turnorder")), function(a) { return a.id === obj.get("id"); });
            Campaign().set("turnorder", JSON.stringify(TurnOrder));
            handleTurnOrderChange(Campaign(), Previous);
        }
	}
    const handleInput = function(msg_orig) {
        if (msg_orig.type !== "api" ) return;
        let msg = _.clone(msg_orig);
        let Command = msg.content.split(" ")[0]
        
        // API COMMANDS
         // Commands with options in brackets like this [on|off] are optional and
         // the api command will usually  toggle between the two options. If the
         // command has parameters listed without brackets like this !dl on|off,
         // the command requires that one of the parameters be present.
        if (Command === "!clear-init" && playerIsGM(msg.playerid)) {
            // This command clears the turn order and removes the green dot
            // from the token at the top of the turn order.
            let turn_order = JSON.parse(Campaign().get("turnorder"));
            if (!turn_order.length) return;
            let current = turn_order.shift();
            if (current.id != -1) getObj("graphic", current.id).set("status_green", false);
            Campaign().set("turnorder", "[]");
            Campaign().set("initiativepage", false);
        }
        if (Command === "!dl" && playerIsGM(msg.playerid)) { 
            // Toggles dynamic lighting on the current map.
            // USAGE: !dl [on|off]
            let Player = getObj("player", msg.playerid);
            let Page = getObj("page", Player.get("lastpage")); log (Page);
            let Option = msg.content.split(" ")[1];
            if (Option !== undefined) {
                if (Option.toLowerCase() == "on") Page.set("showlighting", true);
                else Page.set("showlighting", false);
            } else {
                if (Page.get("showlighting") == true) Page.set("showlighting", false);
                else Page.set("showlighting", true);
            }
        }
        if (Command === "!eot") {
            // Allows the GM and players who control the token at the top of the
            // turn order to end their turn and advance the turn order tracker.
            if (!Campaign().get("turnorder")) return;
            let turn_order = JSON.parse(Campaign().get("turnorder"));
            if (turn_order.length <= 1) return;
            let current = turn_order.shift();
            let next = turn_order.shift();
            if (next.formula == "+1") next.pr = next.pr + 1;
            if (next.formula == "-1") next.pr = next.pr - 1;
            turn_order.unshift(next);
            if (!playerIsGM(msg.playerid)) {
                if (getObj("graphic", current.id).get("represents") != "") {
                    if (!getObj("character", getObj("graphic", current.id).get("represents")).get("controlledby").includes(msg.playerid)) return;
                }
            }
            if (current.id == -1 && current.custom !== undefined && parseInt(current.pr, 10) === 0) sendChat("", `/desc ${current.custom} has ended.`);
            else turn_order.push({id: current.id, pr: current.pr, custom: current.custom, formula: current.formula});
            Campaign().set("turnorder", JSON.stringify(turn_order));
            if (current.id != -1 && SHOW_GREEN_DOT) getObj("graphic", current.id).set("status_green", false);
            if (next.id != -1 && SHOW_GREEN_DOT) getObj("graphic", next.id).set("status_green", true);
            if (ANNOUNCE_NEW_TURN) announceNewTurn([next], [current]);
            if (PULL_GM_TO_TOKEN && next.id != -1) {
                sendPing(-100, -100, Campaign().get("playerpageid"), null, false);
                sendPing(getObj("graphic", next.id).get("left"), getObj("graphic", next.id).get("top"), Campaign().get("playerpageid"), null, true);
            }
            if (next.id != -1) toFront(getObj("graphic", next.id));
        }
        if (Command === "!fix-npctokens" && playerIsGM(msg.playerid) && msg.selected) {
            // This command mimics the snippet that changes npc tokens when they are
            // dropped on the map. It us useful for setting up tokens to the way you
            // prefer them to be set up in modules that already have tokens on the
            // maps. To use this command, select all the tokens you want to change
            // and run the following api command in chat.
            // USAGE: !fix-tokens
            _.each(msg.selected, function(a) {
                let obj = getObj("graphic", a["_id"]);
                if (obj.get(`bar${HIT_POINT_BAR}_link`) !== "" || obj.get("represents") === "") return;
                let CharID = obj.get("represents");
                let HPF = getAttrByName(CharID, "npc_hpformula") || "0d0+0";
                let HitDie_Count = parseInt(HPF.split("d")[0]) || 0;
                let HitDie_Size = parseInt(HPF.split("d")[1]) || 0;
                let HitDie_Mod = parseInt(HPF.split("+")[1]) || 0;
                let Perception = (getAttrByName(CharID, "npc_perception") == "@{wisdom_mod}") ? getAttrByName(CharID, "wisdom_mod") : getAttrByName(CharID, "npc_perception");
                let RandomHP = (RANDOM_NPC_HP) ? parseInt(Math.floor(Math.random() * ((HitDie_Count * HitDie_Size) - HitDie_Count + 1), 10) + HitDie_Count + HitDie_Mod) : getAttrByName(CharID, "npc_hp");
                
                // NPC Token Settings
                obj.set(`showname`, SHOW_NPC_NAMES);
                obj.set(`showplayers_name`, SHOW_NPC_NAMES);
                obj.set("showplayers_bar1", false);
				obj.set("showplayers_bar2", false);
				obj.set("showplayers_bar3", false);
                obj.set(`showplayers_bar${HIT_POINT_BAR}`, SHOW_NPC_HITPOINTS);
                if (ARMOR_CLASS_BAR !== 0) {
                    obj.set(`bar${ARMOR_CLASS_BAR}_link`, "");
                    obj.set(`bar${ARMOR_CLASS_BAR}_value`, getAttrByName(CharID, "npc_ac"));
                    obj.set(`bar${ARMOR_CLASS_BAR}_max`, "");
                }
                if (HIT_POINT_BAR !== 0) {
                    obj.set(`bar${HIT_POINT_BAR}_link`, "");
                    obj.set(`bar${HIT_POINT_BAR}_value`, RandomHP);
                    obj.set(`bar${HIT_POINT_BAR}_max`, RandomHP);
                }
                if (PASSIVE_PERCEPTION_BAR !== 0) {
                    obj.set(`bar${PASSIVE_PERCEPTION_BAR}_link`, "");
                    obj.set(`bar${PASSIVE_PERCEPTION_BAR}_value`, (10 + parseInt(Perception)));
                    obj.set(`bar${PASSIVE_PERCEPTION_BAR}_max`, "");    
                }
                if (SPEED_BAR !== 0) {
                    obj.set(`bar${SPEED_BAR}_link`, "");
                    obj.set(`bar${SPEED_BAR}_value`, getAttrByName(CharID, "npc_speed"));
                    obj.set(`bar${SPEED_BAR}_max`, "");
                }
                obj.set(`light_radius`, "");
                obj.set(`light_dimradius`, "");
                obj.set(`light_otherplayers`, false);
                obj.set(`light_hassight`, false);
                obj.set("status_dead", false);
                setTimeout(function() { setDefaultTokenForCharacter(getObj("character", CharID), obj); }, 500);
            });
        }
        if (Command === "!fix-pctokens" && playerIsGM(msg.playerid) && msg.selected) {
            _.each(msg.selected, function(a) {
                let obj = getObj("graphic", a["_id"]);
                if (obj.get("represents") === "") return;
                let CharID = obj.get("represents");
                
                // PC Token Settings
                obj.set(`showname`, true);
                obj.set(`showplayers_name`, true);
                obj.set("playersedit_name", false);
                obj.set("showplayers_bar1", false);
                obj.set("playersedit_bar1", false);
				obj.set("showplayers_bar2", false);
				obj.set("playersedit_bar2", false);
				obj.set("showplayers_bar3", true);
				obj.set("playersedit_bar3", true);
                obj.set(`light_otherplayers`, false);
                obj.set(`light_hassight`, true);
                obj.set("status_dead", false);
                let ACLink = findObjs({ type: "attribute", name: "ac", characterid: CharID})[0].id;
                let HPLink = findObjs({ type: "attribute", name: "hp", characterid: CharID})[0].id;
                let PPLink = findObjs({ type: "attribute", name: "passive_wisdom", characterid: CharID})[0].id;
                if (ARMOR_CLASS_BAR !== 0) obj.set(`bar${ARMOR_CLASS_BAR}_link`, ACLink);
                if (HIT_POINT_BAR !== 0) obj.set(`bar${HIT_POINT_BAR}_link`, HPLink);
                if (PASSIVE_PERCEPTION_BAR !== 0) obj.set(`bar${PASSIVE_PERCEPTION_BAR}_link`, PPLink);
                setTimeout(function() { setDefaultTokenForCharacter(getObj("character", CharID), obj); }, 500);
            });
        }
        if (Command === "!fow" && playerIsGM(msg.playerid)) {
            let Option = msg.content.split(" ")[1];
            let Player = getObj("player", msg.playerid);
            let Page = getObj("page", Player.get("lastpage"));
            let FOWTokens = findObjs({
                pageid: Page.id,
                type: "graphic",
                name: "HEX_FOW"
            });
            _.each(FOWTokens, function(obj) {
                if (Option !== undefined) {
                    if (Option == "front") toFront(obj);
                    else toBack(obj);
                }
            });
        }
        if (Command === "!group-check" && playerIsGM(msg.playerid) && msg.selected) {
            let Check = msg.content.replace(/<br\/>\n/g, " ").replace(/({{(.*?)}})/g, " $2 ").trim().split(/\s+--/).slice(1);
            let Sorted = [];
            _.each(msg.selected, function(a) {
                let Token = getObj("graphic", a["_id"]);
                a.name = Token.get("name");
                Sorted.push(a);
            });
            Sorted = _.sortBy(Sorted, 'name');
            const doGroupCheckDefered = () => {
                if (Sorted.length) {
                    let Token = getObj('graphic', Sorted.shift()._id);
                    if (Token.get("represents") !== "") {
                        let Character = getObj("character", Token.get("represents"));
                        let CheckType = Check[0];
                        let CheckName = Check[1];
                        let CheckAbbr = Check[2];
                        let Whisper = (Check[3] && Check[3].toUpperCase() !== "GM") ? "": "/w GM ";
                        if (CheckType === "Check") sendChat(`character|${Character.id}`, `${Whisper}&{template:npc}{{name=${Token.get("name")}}} {{rname=${CheckName}}} {{mod=@{${Character.get("name")}|${CheckName}_mod} [${CheckAbbr}]}} {{r1=[[1d20+@{${Character.get("name")}|${CheckName}_mod} [${CheckAbbr}]]]}} @{${Character.get("name")}|rtype}+@{${Character.get("name")}|${CheckName}_mod} [${CheckAbbr}]]]}} {{type=${CheckType}}}`);
                        if (CheckType === "Save") sendChat(`character|${Character.id}`, `${Whisper}&{template:npc}{{name=${Token.get("name")}}} {{rname=${CheckName}}} {{mod=@{${Character.get("name")}|npc_${CheckAbbr}_save} [${CheckAbbr}]}} {{r1=[[1d20+@{${Character.get("name")}|npc_${CheckAbbr}_save} [${CheckAbbr}]]]}} @{${Character.get("name")}|rtype}+@{${Character.get("name")}|npc_${CheckAbbr}_save} [${CheckAbbr}]]]}} {{type=${CheckType}}}`);
                        if (CheckType === "Skill") sendChat(`character|${Character.id}`, `${Whisper}&{template:npc}{{name=${Token.get("name")}}} {{rname=${CheckName}}} {{mod=@{${Character.get("name")}|npc_${CheckName}}}} {{r1=[[1d20+@{${Character.get("name")}|npc_${CheckName}}]]}} @{${Character.get("name")}|rtype}+@{${Character.get("name")}|npc_${CheckName}}]]}} {{type=${CheckType}}}`);
                    }
                    setTimeout(doGroupCheckDefered, 50);
                }
            };
            doGroupCheckDefered();
        }
        if (Command === "!heal" || Command === "!damage") {
            // Heals or damages a token based on which command you use. The amount of
            // healing or damage can be a static amount like 10 or a roll like 2d4+2
            // If you use a roll, there cannot be any spaces in the formula. You can
            // apply the damage or healing to all tokens selected, a single token, or
            // use the target| feature of roll20.
            // USAGE: !heal|damage amount [@{selected|tokenid}|@{target||tokenid}]
            // EXAMPLE: !heal 2d4+2 @{selected|tokenid}
            var Amount = msg.content.split(" ")[1].replace(/^[\$|\+|\-|\[\[]+/, "").replace(/\]\]$/, "").trim();
            var TokenID = msg.content.split(" ")[2];
            if (Amount === undefined || (TokenID === undefined && msg.selected === undefined)) return;
            if (msg.selected === undefined) msg.selected = [{"_id": TokenID,"_type": "graphic"}];
            _.each(msg.selected, function(a) {
                var Token = getObj("graphic", a["_id"]);
                if (Token !== undefined) adjustTokenHP(Command, Amount, Token);
            });
        }
        if (Command === "!list-attrs" && playerIsGM(msg.playerid)) {
            let TokenID = msg.content.split(" ")[1];
            if (TokenID === undefined && msg.selected === undefined) return;
            if (msg.selected === undefined) msg.selected = [{
                "_id": TokenID,
                "_type": "graphic"
            }];
            _.each(msg.selected, function(a) {
                let Token = getObj("graphic", a["_id"]);
                if (Token !== undefined) {
                    log (Token);
                }
            });
        }
        if (Command === "!icon") {
            // Toggles status icons on the selected or targeted tokens. 
            // USAGE: !icon [red|blue|green|brown|purple|pink|yellow|dead|skull|sleepy|
            // half-heart|half-haze|interdiction|snail|lightning-helix|spanner|
            // chained-heart|chemical-bolt|death-zone|drink-me|edge-crack|ninja-mask|
            // stopwatch|fishing-net|overdrive|strong|fist|padlock|three-leaves|
            // fluffy-wing|pummeled|tread|arrowed|aura|back-pain|black-flag|
            // bleeding-eye|bolt-shield|broken-heart|cobweb|broken-shield|flying-flag|
            // radioactive|trophy|broken-skull|frozen-orb|rolling-bomb|white-tower|
            // grab|screaming|grenade|sentry-gun|all-for-one|angel-outfit|archery-target]
            let Icon = msg.content.split(" ")[1] || "clear";
            let TokenID = msg.content.split(" ")[2];
            if (TokenID === undefined && msg.selected === undefined) return;
            if (msg.selected === undefined) msg.selected = [{
                "_id": TokenID,
                "_type": "graphic"
            }];
            _.each(msg.selected, function(a) {
                let Token = getObj("graphic", a["_id"]);
                let StatusIcons = Token.get("statusmarkers")
                if (Icon.toLowerCase() == "clear") {
                    Token.set("statusmarkers", "");
                } else {
                    if (Token.get("status_" + Icon) === false) Token.set("status_" + Icon, true);
                    else Token.set("status_" + Icon, false);
                }
            });
        }
        if (Command === "!reset-tokens" && playerIsGM(msg.playerid) && msg.selected) {
            // Removes all status icons from selected tokens and raises their current
            // hit points their max value.
            // USAGE: !reset-tokens
            let TokenID = msg.content.split(" ")[1];
            if (TokenID === undefined && msg.selected === undefined) return;
            if (msg.selected === undefined) msg.selected = [{
                "_id": TokenID,
                "_type": "graphic"
            }];
            _.each(msg.selected, function(a) {
                let Token = getObj("graphic", a["_id"]);
                if (Token !== undefined) {
                    Token.set("statusmarkers", "");
                    Token.set(`bar${HIT_POINT_BAR}_value`, Token.get(`bar${HIT_POINT_BAR}_max`));
                }
            });
        }
        if (Command === "!resize" && playerIsGM(msg.playerid)) {
            // Resizes tokens using the values in pixels. Leaving out the width
            // will set the height and width to be equal.
            // USAGE: !resize height width
            let TokenHeight = msg.content.split(" ")[1] || 70;
            let TokenWidth = msg.content.split(" ")[2] || TokenHeight;
            if (msg.selected === undefined) return;
            _.each(msg.selected, function(a) {
                let Token = getObj("graphic", a["_id"]);
                if (Token !== undefined) {
                    Token.set("height", TokenHeight);
                    Token.set("width", TokenWidth);
                }
            });
        }
        if (Command === "!roll-init" && playerIsGM(msg.playerid) && msg.selected) {
            let turn_order = (!Campaign().get("turnorder")) ? [] : JSON.parse(Campaign().get("turnorder"));
            let token, mod, index;
            _.each(msg.selected, function (a) {
                token = getObj("graphic", a._id);
                if (token.get("name") == "Round") {
                    turn_order.push({id: a._id, pr: 999, formula: "+1"});
                } else {
                    mod = (token.get("represents") !== "" && getObj("character", token.get("represents")) !== undefined) ? parseInt(Math.floor((getAttrByName(token.get("represents"), "dexterity") - 10) / 2)) + parseInt(getAttrByName(token.get("represents"), "initmod")) : 0;
                    index = turn_order.findIndex(x => x.id == a._id);
                    if (index != -1) turn_order[index].pr = Math.floor((Math.random() * 20) + 1) + mod;
                    else turn_order.push({id: a._id, pr: Math.floor((Math.random() * 20) + 1) + mod});
                }
            });
            Campaign().set("initiativepage", true);
            Campaign().set("turnorder", JSON.stringify(turn_order));
        }
        if (Command === "!sdt" && playerIsGM(msg.playerid) && msg.selected) {
            // Sets the selected token as the default token for the character sheet it represents
            _.each(msg.selected, function(a) {
                let obj = getObj("graphic", a["_id"]);
                if (obj.get("represents") === "") return;
                let CharID = obj.get("represents");
                setDefaultTokenForCharacter(getObj("character", CharID), obj);
            });
        }
        if (Command === "!sort-init" && playerIsGM(msg.playerid)) {
            // Sorts the turn order and places the Round counter at the top if
            // being used and changes its value to one to mark the start of the
            // first round of combat.
            if (!Campaign().get("turnorder")) return;
            let turn_order = JSON.parse(Campaign().get("turnorder"));
            if (!turn_order.length) return;
            let method = (msg.content.split(" ")[1] !== undefined && msg.content.split(" ")[1].toLowerCase().indexOf("a") === 0) ? "ascending" : "descending";
            let current = turn_order[0];
            let sorted_turn_order = (method == "descending") ? _.sortBy(turn_order, "pr").reverse() : _.sortBy(turn_order, "pr");
            let next = sorted_turn_order.shift();
            if (next.pr == 999) next.pr = 1;
            sorted_turn_order.unshift(next);
            Campaign().set("turnorder", JSON.stringify(sorted_turn_order));
            if (current.id != -1 && SHOW_GREEN_DOT) getObj("graphic", current.id).set("status_green", false);
            if (next.id != -1 && SHOW_GREEN_DOT) getObj("graphic", next.id).set("status_green", true);
            if (ANNOUNCE_NEW_TURN) announceNewTurn([next], [current]);
        }
        if (Command === "!track-effect") {
            let turn_order = (!Campaign().get("turnorder")) ? [] : JSON.parse(Campaign().get("turnorder"));
            let Effect = msg.content.split("--")[1] || "Error";
            let Duration = msg.content.split("--")[2] || 999;
            let Owner = msg.content.split("--")[3] || "";
            if (Effect === "Error" || Duration === 999) return;
            turn_order.push({id: "-1", pr: Duration, custom: Effect.trim() + ((Owner !== "") ? ` (${Owner})` : ""), formula: "-1"});
            Campaign().set("initiativepage", true);
            Campaign().set("turnorder", JSON.stringify(turn_order));
        }
        if (Command === "!vision" && playerIsGM(msg.playerid)) {
            // Changes a selected token or tokens vision and light settings. Using the
            // command without an option sets the vision at 5/-1 and sets it to not
            // emit light for all players to see. This is so a player can see their
            // token and little else around them.
            // USAGE: !vision [candle|continual_flame|etc...]  
            if (!playerIsGM(msg.playerid)) return;
            let Option = msg.content.split(" ")[1];
            let TokenID = msg.content.split(" ")[2];
            if (Option === undefined || (TokenID === undefined && msg.selected === undefined)) return;
            if (msg.selected === undefined) msg.selected = [{
                "_id": TokenID,
                "_type": "graphic"
            }];
            _.each(msg.selected, function(a) {
                var Token = getObj("graphic", a["_id"]);
                if (Token !== undefined) {
                    Token.set("light_otherplayers", true);
                    Token.set("light_angle", 360);
                    if (Option.toLowerCase() === "none") {
                        Token.set("light_radius", "");
                        Token.set("light_dimradius", "");
                        Token.set("light_otherplayers", false);
                    } else if (Option.toLowerCase() === "standard") {
                        Token.set("light_radius", 5);
                        Token.set("light_dimradius", -1);
                        Token.set("light_otherplayers", false);
                    } else if (Option.toLowerCase() === "candle") {
                        Token.set("light_radius", 10);
                        Token.set("light_dimradius", 5);
                    } else if (Option.toLowerCase() === "continual_flame") {
                        Token.set("light_radius", 60);
                        Token.set("light_dimradius", 30);
                    } else if (Option.toLowerCase() === "fire_beetle") {
                        Token.set("light_radius", 20);
                        Token.set("light_dimradius", 10);
                    } else if (Option.toLowerCase() === "darkvision_60") {
                        Token.set("light_radius", 60);
                        Token.set("light_dimradius", 60);
                        Token.set("light_otherplayers", false);
                    } else if (Option.toLowerCase() === "darkvision_90") {
                        Token.set("light_radius", 90);
                        Token.set("light_dimradius", 90);
                        Token.set("light_otherplayers", false);
                    } else if (Option.toLowerCase() === "darkvision_120") {
                        Token.set("light_radius", 120);
                        Token.set("light_dimradius", 120);
                        Token.set("light_otherplayers", false);
                    } else if (Option.toLowerCase() === "daylight") {
                        Token.set("light_radius", 120);
                        Token.set("light_dimradius", 60);
                    } else if (Option.toLowerCase() === "everburning_torch") {
                        Token.set("light_radius", 40);
                        Token.set("light_dimradius", 20);
                    } else if (Option.toLowerCase() === "fog_light") {
                        Token.set("light_radius", 60);
                        Token.set("light_dimradius", -1);
                        Token.set("light_otherplayers", false);
                    } else if (Option.toLowerCase() === "fog_moderate") {
                        Token.set("light_radius", 40);
                        Token.set("light_dimradius", -1);
                        Token.set("light_otherplayers", false);
                    } else if (Option.toLowerCase() === "fog_heavy") {
                        Token.set("light_radius", 20);
                        Token.set("light_dimradius", -1);
                        Token.set("light_otherplayers", false);
                    } else if (Option.toLowerCase() === "fog_solid") {
                        Token.set("light_radius", 10);
                        Token.set("light_dimradius", -1);
                        Token.set("light_otherplayers", false);
                    } else if (Option.toLowerCase() === "lamp") {
                        Token.set("light_radius", 30);
                        Token.set("light_dimradius", 15);
                    } else if (Option.toLowerCase() === "lantern_bullseye") {
                        Token.set("light_radius", 120);
                        Token.set("light_dimradius", 60);
                        Token.set("light_angle", 60);
                    } else if (Option.toLowerCase() === "lantern_hooded_bright") {
                        Token.set("light_radius", 60);
                        Token.set("light_dimradius", 30);
                    } else if (Option.toLowerCase() === "lantern_hooded_dim") {
                        Token.set("light_radius", 5);
                        Token.set("light_dimradius", -1);
                    } else if (Option.toLowerCase() === "light") {
                        Token.set("light_radius", 40);
                        Token.set("light_dimradius", 20);
                    } else if (Option.toLowerCase() === "torch") {
                        Token.set("light_radius", 40);
                        Token.set("light_dimradius", 20);
                    } else if (Option.toLowerCase() === "sunrod") {
                        Token.set("light_radius", 90);
                        Token.set("light_dimradius", 30);
                    } else {
                        Token.set("light_radius", 5);
                        Token.set("light_dimradius", -1);
                        Token.set("light_otherplayers", false);
                    }
                }
            });
        }
        // END COMMANDS
    }
    const handleTokenDrop = function(obj) {
        setTimeout(function() {
            if (obj.get("type") === "graphic" && obj.get("subtype") === "token" && obj.get("represents") !== "" && obj.get("layer") !== "map") {
                if (Boolean(Number(getAttrByName(obj.get("represents"), "npc"))) === false) return;
                if (obj.get("bar1_link") !== "" || obj.get("bar3_link") !== "" || obj.get("layer") == "map") return;
                if (obj.get("controlledby") == "all") toBack(obj);
                let CharID = obj.get("represents");
				let HPF = getAttrByName(CharID, "npc_hpformula") || "0d0+0";
				let HitDie_Count = parseInt(HPF.split("d")[0], 10) || 0;
				let HitDie_Size = parseInt(HPF.split("d")[1], 10) || 0;
				let HitDie_Mod = parseInt(HPF.split("+")[1], 10) || 0;
				let RandomHP = (RANDOM_NPC_HP) ? parseInt(Math.floor(Math.random() * ((HitDie_Count * HitDie_Size) - HitDie_Count + 1), 10) + HitDie_Count + HitDie_Mod) : getAttrByName(CharID, "npc_hp");
				let Perception = (getAttrByName(CharID, "npc_perception") == "@{wisdom_mod}") ? getAttrByName(CharID, "wisdom_mod") : getAttrByName(CharID, "npc_perception");
				
				// NPC Token Settings
                obj.set(`showname`, SHOW_NPC_NAMES);
                obj.set(`showplayers_name`, SHOW_NPC_NAMES);
                obj.set("showplayers_bar1", false);
				obj.set("showplayers_bar2", false);
				obj.set("showplayers_bar3", false);
                obj.set(`showplayers_bar${HIT_POINT_BAR}`, SHOW_NPC_HITPOINTS);
                if (ARMOR_CLASS_BAR !== 0) {
                    obj.set(`bar${ARMOR_CLASS_BAR}_link`, "");
                    obj.set(`bar${ARMOR_CLASS_BAR}_value`, getAttrByName(CharID, "npc_ac"));
                    obj.set(`bar${ARMOR_CLASS_BAR}_max`, "");
                }
                if (HIT_POINT_BAR !== 0) {
                    obj.set(`bar${HIT_POINT_BAR}_link`, "");
                    obj.set(`bar${HIT_POINT_BAR}_value`, RandomHP);
                    obj.set(`bar${HIT_POINT_BAR}_max`, RandomHP);
                }
                if (PASSIVE_PERCEPTION_BAR !== 0) {
                    obj.set(`bar${PASSIVE_PERCEPTION_BAR}_link`, "");
                    obj.set(`bar${PASSIVE_PERCEPTION_BAR}_value`, (10 + parseInt(Perception)));
                    obj.set(`bar${PASSIVE_PERCEPTION_BAR}_max`, "");    
                }
                if (SPEED_BAR !== 0) {
                    obj.set(`bar${SPEED_BAR}_link`, "");
                    obj.set(`bar${SPEED_BAR}_value`, getAttrByName(CharID, "npc_speed"));
                    obj.set(`bar${SPEED_BAR}_max`, "");
                }
                obj.set(`light_radius`, "");
                obj.set(`light_dimradius`, "");
                obj.set(`light_otherplayers`, false);
                obj.set(`light_hassight`, false);
				obj.set("status_dead", false);
				setTimeout(function() { setDefaultTokenForCharacter(getObj("character", CharID), obj); }, 500);
			}
		}, 500);
    }
    const handleTokenHPChange = function (obj, prev) {
        if (obj.get("layer") == "map" || obj.get("subtype") !== "token" || obj.get("isdrawing") === true || parseInt(prev[`bar${HIT_POINT_BAR}_value`], 10) === parseInt(obj.get(`bar${HIT_POINT_BAR}_value`), 10)) return;
        let HP_Previous = parseInt(prev[`bar${HIT_POINT_BAR}_value`], 10) || 0;
        let HP_Current = parseInt(obj.get(`bar${HIT_POINT_BAR}_value`), 10) || 0;
        let HP_Max = parseInt(obj.get(`bar${HIT_POINT_BAR}_max`), 10) || 0;
        let HP_OldMax = parseInt(prev[`bar${HIT_POINT_BAR}_max`], 10) || 0;
        let HP_Change = HP_Previous - HP_Current;
        let isNPC = (obj.get("represents") !== "") ? Boolean(Number(getAttrByName(obj.get("represents"), "npc"))) : true;
        let TokenName = (obj.get("name") !== "" && ((SHOW_NPC_NAMES === true && obj.get("showplayers_name") === true) || isNPC === false)) ? obj.get("name") : "NPC";
        if (HP_Change != 0 && HP_Max == HP_OldMax) damageNumber(obj, HP_Change, HP_Previous, HP_Current, HP_Max);
        if (HP_Current > Math.floor(HP_Max/2)) {
            // if (HP_Current > HP_Max) obj.set(`bar${HIT_POINT_BAR}_value`, HP_Max);
            obj.set("status_dead", false);
            obj.set("status_half-heart", false);
            obj.set("status_skull", false);
        } else if (HP_Current <= Math.floor(HP_Max/2) && HP_Current > 0) {
            obj.set("status_half-heart", true);
            obj.set("status_dead", false);
            obj.set("status_skull", false);
        } else {
            if (isNPC) {
                obj.set("status_dead", true);
                if (JSON.parse(Campaign().get("turnorder")).length > 0) {
                    var Previous = JSON.parse(JSON.stringify(Campaign()));
                    var TurnOrder = _.reject(JSON.parse(Campaign().get("turnorder")), function(a) { return a.id === obj.get("id")});
                    if (TurnOrder[0].formula == "+1") TurnOrder[0].pr = TurnOrder[0].pr + 1;
                    Campaign().set("turnorder", JSON.stringify(TurnOrder));
                    handleTurnOrderChange(Campaign(), Previous);
                }
            } else {
                if (CHECK_INSTANT_DEATH && Math.abs(HP_Current) >= HP_Max) obj.set("status_dead", true);
                else obj.set("status_skull", true);
                obj.set("status_back-pain", true);
            }
            obj.set("status_half-heart", false);
            obj.set(`bar${HIT_POINT_BAR}_value`, 0);
        }
        
        if (CHECK_SYSTEM_SHOCK && HP_Current > 0 && HP_Change > Math.floor(HP_Max/2)) {
            sendChat("DM Toolkit", `&{template:traits} {{name=Massive Damage}} {{description=<b>${TokenName}</b> has taken massive damage! Make a DC 15 Constitution saving throw. On a failure, roll System Shock (pg 273 DMG).}}`);
        }
    }
    const handleTurnOrderChange = function (obj, prev) {
        let current = JSON.parse(obj.get("turnorder") || []);
        let previous = JSON.parse(prev["turnorder"]) || [];
        if (obj.get("turnorder") && !obj.get("initiativepage")) Campaign().set("initiativepage", true);
        if (_.isEmpty(current) || _.isEmpty(previous)) return;
        if (_.isEmpty(previous) === false) {
            if (previous[0].id == -1 && previous[0].custom !== undefined && parseInt(previous[0].pr, 10) === 0) {
                sendChat("", `/desc ${previous[0].custom} has ended.`);
                current.splice(-1);
                Campaign().set("turnorder", JSON.stringify(current));
            }
            if (current[0].id === previous[0].id) return;
        }
        if (SHOW_GREEN_DOT && previous.length > 0 && previous[0].id != -1 && getObj("graphic", previous[0].id) !== undefined) getObj("graphic", previous[0].id).set("status_green", false);
        if (SHOW_GREEN_DOT && current.length > 0 && current[0].id != -1 && getObj("graphic", current[0].id) !== undefined) getObj("graphic", current[0].id).set("status_green", true);
        if (ANNOUNCE_NEW_TURN) announceNewTurn(current, previous);
        if (PULL_GM_TO_TOKEN && current[0].id != -1) {
            sendPing(-100, -100, Campaign().get("playerpageid"), null, false);
            sendPing(getObj("graphic", current[0].id).get("left"), getObj("graphic", current[0].id).get("top"), Campaign().get("playerpageid"), null, true);
        }
        if (current[0].id != -1) toFront(getObj("graphic", current[0].id));
    }
    const scaleFont = function(height, width, hpChange, hpMax){
        const pxPerUnit = 70;
        let scaledFont = config.fontSize;
        if (config.tokenSizeScaling) {
            let tokenScale = (height + width) / (2 * pxPerUnit);
            scaledFont *= Math.max(tokenScale, 1);
        }
        if (config.majorDamageScaling && Math.abs(hpChange) * 2 > hpMax) scaledFont *= 3;
        return scaledFont;
    }
    const sortObject = function(obj) {
        return Object.keys(obj).sort().reduce((r, k) => (r[k] = obj[k], r), {});
    }
    const updateDamageNumber = function(number, targetTop, steps) {
        if(steps <= 0) {
            number.remove();
            return;
        }
        
        let top = number.get('top');
        top += (targetTop - top) * 0.3;
        number.set('top', top);
        setTimeout(function () {
            updateDamageNumber(number, targetTop, steps - 1);
        }, 50);
    }

    on("ready", function() {
        //registerEventHandlers();
        on(`add:graphic`, handleTokenDrop);
        on(`change:campaign:turnorder`, handleTurnOrderChange);
        on(`change:token:bar${HIT_POINT_BAR}_value`, handleTokenHPChange);
        on(`chat:message`, handleInput);
        on(`destroy:graphic`, handleDeletedToken);
        //on(`change:attribute`, enforceDefaults);
        log("-=> DMToolkit v" + DMToolkit_Version + " <=- [" + (new Date(DMToolkit_LastUpdated * 1000)) + "]");
        //log(Date.now().toString().substr(0, 10));
    });
})();
