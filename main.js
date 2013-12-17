var timer;
var nonceDate = (new Date).getTime()
function save(){
    localStorage.api_username = $('#api_username').val();
    localStorage.api_key = $('#api_key').val();
    localStorage.api_secret = $('#api_secret').val();
    localStorage.update_interval = $('#update_interval').val();
    clearInterval(timer);
    timer = setInterval(update, (localStorage.update_interval *60000));
    update();
    alert('Api details saved. Swipe right to view open orders and place new orders.');
}

function handleTransaction(result){
    if (result.id){
        alert('Order placed');
    }
    else {
        alert('Error, order not placed. Error given: '+result.error);
    }
}

function pasteFunc(target){
    window.plugins.clipboard.paste(function (text) { $('#'+target).val(text) });
}

function transaction(id){
    var url,buyingtype,sellingtype,type,amount,price;
    if (id == 'btc_ghs_buy'){
        url = 'https://cex.io/api/place_order/GHS/BTC';
        buyingtype = 'GHS';
        sellingtype = 'BTC';
        type='Buy';
        amount = $('#'+id+'_amount').val();
        price = $('#'+id+'_price').val();
    }
    if (id == 'btc_ghs_sell'){
        url = 'https://cex.io/api/place_order/GHS/BTC';
        buyingtype = 'GHS';
        sellingtype = 'BTC';
        type='Sell';
        amount = $('#'+id+'_amount').val();
        price = $('#'+id+'_price').val();
    }
    if (id == 'nmc_ghs_sell'){
        url = 'https://cex.io/api/place_order/GHS/NMC';
        buyingtype = 'GHS';
        sellingtype = 'NMC';
        type='Sell';
        amount = $('#'+id+'_amount').val();
        price = $('#'+id+'_price').val();
    }
    if (id == 'nmc_ghs_buy'){
        url = 'https://cex.io/api/place_order/GHS/NMC';
        buyingtype = 'GHS';
        sellingtype = 'NMC';
        type='Buy';
        amount = $('#'+id+'_amount').val();
        price = $('#'+id+'_price').val();
    }
    if (id == 'nmc_btc_buy'){
        url = 'https://cex.io/api/place_order/NMC/BTC';
        buyingtype = 'NMC';
        sellingtype = 'BTC';
        type='Buy';
        amount = $('#'+id+'_amount').val();
        price = $('#'+id+'_price').val();
    }
    if (id == 'nmc_btc_sell'){
        url = 'https://cex.io/api/place_order/NMC/BTC';
        buyingtype = 'NMC';
        sellingtype = 'BTC';
        type='Sell';
        amount = $('#'+id+'_amount').val();
        price = $('#'+id+'_price').val();
    }
    var nonce = getNonce();
    var signature = CryptoJS.HmacSHA256(nonce+localStorage.api_username+localStorage.api_key, localStorage.api_secret)
    if (window.confirm(type+' '+amount+ ' '+buyingtype+' at '+price+' '+sellingtype+'/'+buyingtype+'?') === true){
        $.post(url, {
            'key': localStorage.api_key,
            'nonce': nonce,
            'signature': signature.toString(),
            'type':type.toLowerCase(),
            'amount':amount,
            'price':price,
        },handleTransaction).then(update());
    }
}

function updatePriceBTC(response){
    $('.btc_ghs_pricetext').html(response.last);
}

function updatePriceNMC(response){
    $('.nmc_ghs_pricetext').html(response.last);
}

function updatePriceNMCBTC(response){
    $('.nmc_btc_pricetext').html(response.last);
}

function updateBalance(response){
    if (response.error == "Nonce must be incremented"){
        var nonce = getNonce();
        $.post('https://cex.io/api/balance/', {
            'key': localStorage.api_key,
            'nonce': nonce,
            'signature': CryptoJS.HmacSHA256(nonce+localStorage.api_username+localStorage.api_key, localStorage.api_secret).toString(),
        },updateBalance);
    }
    $('.btc_balance').html(response.BTC.available);
    $('.ghs_balance').html(response.GHS.available);
    $('.nmc_balance').html(response.NMC.available);
}

function cancelOrder(id){
    var nonce = getNonce();
    var signature = CryptoJS.HmacSHA256(nonce+localStorage.api_username+localStorage.api_key, localStorage.api_secret)
    $.post('https://cex.io/api/cancel_order/', {
            'key': localStorage.api_key,
            'nonce': nonce,
            'signature': signature.toString(),
            'id':id,
        },function(response){
            if(response===true){
                alert('Order canceled.');
            }
            else{
                alert('Error:'+response);
            }
        });
    update();
}

function updateOrders(response,commodity){
    if (response.error == "Nonce must be incremented"){
        var nonce = getNonce();
        $.post('https://cex.io/api/open_orders/' + commodity, {
            'key': localStorage.api_key,
            'nonce': nonce,
            'signature': CryptoJS.HmacSHA256(nonce+localStorage.api_username+localStorage.api_key, localStorage.api_secret).toString(),
        },function(response){
            updateOrders(response,commodity);
        });
    }
    for (var i = 0, length = response.length; i < length ; i++){
        var order = response[i];
        var now = new Date(parseInt(order.time));
        var displayDate = now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate()+ ' '+now.getHours()+':'+now.getMinutes(); 
        $('#order_table').append('<tr><td>'+commodity+'</td><td>'+order.type+'</td><td>'+order.price+'</td><td>'+order.amount+'</td><td>'+displayDate+'</td><td>'+'<input type="cancel_button" value="Cancel" onclick="cancelOrder('+"'"+order.id+"'"+')"></td></tr>');
    }
}

function getNonce(){
    nonceDate ++;
    return nonceDate;
}

function update(){
    $('#refreshIcon').addClass('fa-spin');
    var nonce = getNonce();
    $.post('https://cex.io/api/balance/', {
        'key': localStorage.api_key,
        'nonce': nonce,
        'signature': CryptoJS.HmacSHA256(nonce+localStorage.api_username+localStorage.api_key, localStorage.api_secret).toString(),
	},updateBalance);
	var nonce = getNonce();
	$("#order_table").find("tr:gt(0)").remove();
	$.post('https://cex.io/api/open_orders/GHS/BTC', {
        'key': localStorage.api_key,
        'nonce': nonce,
        'signature': CryptoJS.HmacSHA256(nonce+localStorage.api_username+localStorage.api_key, localStorage.api_secret).toString(),
	},function(response){
        updateOrders(response,'GHS/BTC');
	});
	var nonce = getNonce();
	$.post('https://cex.io/api/open_orders/GHS/NMC', {
        'key': localStorage.api_key,
        'nonce': nonce,
        'signature': CryptoJS.HmacSHA256(nonce+localStorage.api_username+localStorage.api_key, localStorage.api_secret).toString(),
	},function(response){
        updateOrders(response,'GHS/NMC');
	});
	var nonce = getNonce();
	$.post('https://cex.io/api/open_orders/NMC/BTC', {
        'key': localStorage.api_key,
        'nonce': nonce,
        'signature': CryptoJS.HmacSHA256(nonce+localStorage.api_username+localStorage.api_key, localStorage.api_secret).toString(),
	},function(response){
        updateOrders(response,'NMC/BTC');
	});
	$.get('https://cex.io/api/ticker/GHS/BTC',updatePriceBTC);
	$.get('https://cex.io/api/ticker/GHS/NMC',updatePriceNMC);
	$.get('https://cex.io/api/ticker/NMC/BTC',updatePriceNMCBTC).then(function(){
        var now = new Date();
        $('#refreshIcon').removeClass('fa-spin');
        $('#update-time').html(' '+now.getHours()+':'+now.getMinutes());
	});
}

function totalUpdate(event){
    setTimeout(function() {
        var parent = $(event.target).parent();
        var values = parent.find( ".order_price" );
        parent.find('.totaltext').html((values.eq(0).val() * values.eq(1).val()).toFixed(8));
    }, 0);
}

function initialise(){
    var mySwiper = new Swiper('.swiper-container',{
        mode:'horizontal',
        initialSlide: 2,
        simulateTouch: false,
    });  
    $('#save_button').click(save);
    if (localStorage.update_interval) {
        timer = setInterval(update, (localStorage.update_interval *60000));
        update();
    }
    else{
        alert('Swipe left twice to input your api details.');
    }
    $('.table').css('width',$('.slide-wrapper').width());
    $('.slide-cont').css('width',$('.slide-wrapper').width());
    $('.order_price').keypress( totalUpdate );
    $('#refreshIcon').click(update);
}
$( window ).resize(function() {
    setTimeout(function() {
    $('.table').css('width',$('.slide-wrapper').width());
    $('.slide-cont').css('width',$('.slide-wrapper').width());
    }, 0);
});
$(document).ready(function() {
	initialise();
});