// ==UserScript==
// @name         Kykyruza EAN Saver
// @namespace    https://github.com/alezhu/kykyryza_ean_saver
// @version      1.0
// @description  Manage kykyruza EAN on login page
// @author       alezhu
// @match        https://oplata.kykyryza.ru/personal/pub/Entrance
// @grant        none
// @source       https://raw.githubusercontent.com/alezhu/kykyryza_ean_saver/master/kykyryza_ean_saver.user.js
// @updateURL    https://raw.githubusercontent.com/alezhu/kykyryza_ean_saver/master/kykyryza_ean_saver.user.js
// @downloadURL  https://raw.githubusercontent.com/alezhu/kykyryza_ean_saver/master/kykyryza_ean_saver.user.js
// ==/UserScript==

(function(){
    var STORAGE_NAME = "alezhu.kykyryza.cards";
    this.form = null;
    this.input_ean = null;
    this.cards = [];
    this._editable_loaded = false;

    this.load_cards = function( ){
        var cards_str = "";
        cards_str = localStorage[STORAGE_NAME];
        //chrome.storage.sync.get("data", function(object) { cards_str = object.data; });

        if(cards_str) {
            var cards_pair = cards_str.split("\n");    
            for(var index = 0; index < cards_pair.length;index++){
                var pair = cards_pair[index].split("|");
                cards.push( { ean : pair[0] , comment : pair[1] } );
            }
        }        
    };

    this.save_cards = function() {
        var cards_pair= [];
        for(var index = 0; index < cards.length;index++){
            var card = cards[index];
            var pair = card.ean + '|' + card.comment;
            cards_pair.push(pair);
        }
        var cards_str = cards_pair.join("\n");
        localStorage[STORAGE_NAME] = cards_str;
        //chrome.storage.sync.set({ data: cards_str} );
    };

    this.add_cards2page = function( ) {
        var last_div = form.find("div:last");
        for(var index = 0; index < cards.length;index++){
            var card = cards[index];
            var div = add_card2page(card);
            last_div.after(div);
            last_div = div;
        }
    };

    this.is_ean_exists = function(ean) {
        for(var index = 0; index < cards.length;index++){
            if(cards[index].ean === ean) return true;
        }
        return false;
    };

    this.add_card2page = function(card) {
        load_editable( );
        return $("<div></div>")
        .attr("id",card.ean)
        .append(
            $('<a href="#" target="_blank" class="pseudo-link" style="display:inline-block">[X]</a>')
            .click(function(event) {
                event.preventDefault( );
                delete_card($(this).data("ean"));
                return false;
            }).data("ean",card.ean)            
        )         
        .append( 
            $('<a href="#" target="_blank" class="pseudo-link" style="display:inline-block;width:8em;margin: 0em 1em"></a>')
            .text(card.ean)
            .click(function(event) {
                event.preventDefault( );
                input_ean.val( $( this ).data("ean"));
                return false;
            }).data("ean",card.ean)
        )
        .append(
            $('<a href="#" class="pseudo-link editable" style="display:inline-block;"></a>')
            .text( getComment(card.comment) )
            .myeditable( )
            .click(function(event) {
                event.preventDefault( );
                return false;
            })            
            .data("ean",card.ean)            
        )

        ;
    };    

    this.add_card = function(ean,comment) {
        var card = { ean : ean , comment : comment } ;
        cards.push( card );
        save_cards( );
        return add_card2page(card);
    };

    this.delete_card = function(ean) {
        for(var index = 0; index < cards.length;index++){
            var card = cards[index];
            if(card.ean == ean) {
                cards.splice(index);
                break;
            }
        }    
        save_cards( );
        delete_card_from_page( ean );
    };

    this.delete_card_from_page = function(ean) {
        $("div#"+ean).remove( );
    };


    this.load_editable = function( ){
        if(_editable_loaded) return;
        $.getScript("https://rawgit.com/tuupola/jquery_jeditable/master/jquery.jeditable.js", function() {
            _editable_loaded = true;
            $(".editable").myeditable( );
        });
    };

    this.getComment = function ( comment ){
        return (comment == "undefined" || comment === "")?"<Комментарий>":comment;
    };

    //-------------
    load_cards( );

    $.fn.myeditable = function() {
        if(this.editable) this.editable( function(value, settings) {
            console.log(this);
            console.log(value);
            console.log(settings);
            value = value.replace("/\|/gi", '');
            var ean = $(this).text(value).data("ean");
            for(var index = 0; index < cards.length;index++){
                var card = cards[index];
                if(card.ean == ean) {
                    card.comment = value;
                    break;
                }
            }               

            save_cards( );
        },{
            style  : "inherit",
            data: function(value, settings) {
                var retval = value.replace(/[<>|]/gi, '').replace(/&lt;Комментарий&gt;/gi,"");
                return retval;
            }            
        });
        return this;
    };

    $(document).ready(function(){
        form = $('form[name="login"]');
        input_ean = form.find("input#ean");

        if(cards.length > 0)add_cards2page( );

        var last_div = form.find("div:last");
        var add_link = $('<a href="#" target="_blank" class="pseudo-link js-popup">Добавить карту из поля ввода</a>');
        add_link.click(function(event) {
            event.preventDefault( );
            ean = input_ean.val();
            if(!is_ean_exists(ean)){
                form.find("div:last").after(add_card(ean,""));
            }
            return false;
        });
        last_div.after(add_link);
        add_link.insertAfter(last_div);
    });
})();

