//To solve the captcha, i`m overriding their function. The code that I`ve changed will be commented below, all the rest is exactly the same as the original function.

Recaptcha.getToken = async function (settings) {
    settings.exigeCaptcha = Recaptcha.getFormularioExigeCaptcha(settings.rotina, settings.acao, settings.exigeCaptcha);
    settings = $.extend({ rotina: null, acao: null, processo: null, exigeCaptcha: null, url: null, completo: function () {} }, settings);
    if (settings.url && !em_branco(settings.url)) {
        var oLink = new Link(settings.url);
        oLink.setUrl(settings.url);
        var oQueryKey = oLink.getQueryKey();
        if (em_branco(settings.processo) && oQueryKey.processo) {
            settings.processo = oQueryKey.processo;
        }
        if (em_branco(settings.rotina) && oQueryKey.rot) {
            settings.rotina = oQueryKey.rot;
        }
        if (em_branco(settings.acao) && oQueryKey.acao) {
            settings.acao = oQueryKey.aca;
        }
    }
    if (!Recaptcha.requisicaoExigeCaptcha(settings.rotina, settings.acao, settings.processo, settings.exigeCaptcha) && settings.exigeCaptcha != CONST.CAPTCHA.FORMULARIO_SEM_RESTRICAO) {
        return false;
    }
    if (__bDesenvolvimento) {
        settings.completo.apply(null, ["ipm"]);
        return true;
    }
    //I`m overriding this part, to call an endpoint on my local machine that handles the request to bestcaptchasolver using the NodeJs library.
    var fnExecute = async function () {
        var sAction = "r" + settings.rotina + "a" + settings.acao;
        var token = await new Promise(async (resolve, reject) => {   
            await fetch('http://localhost:3000/api/v1/recaptchaV3', {
                method:'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    urlSite: 'https://pinhais.atende.net//?pg=transparencia#!/grupo/1/item/1/tipo/1',
                    dataSiteKey:__sGoogleRecaptchaSiteKeyV3,
                    action:sAction,
                    minScore:'0.5',
                    cookies: document.cookie + ';PHPSESSID='+__sSessionId+';_GRECAPTCHA='+localStorage._grecaptcha
                })
            }).then(response => response.json()
            .then(r => resolve(r.data.resolution)))
            .catch(err => reject(err))
        });
        console.log(token);
        console.log(settings.completo);
    //I use the token that I receive from bestcaptchasolver the same way the original function uses the token returned by google: 
        settings.completo.apply(null, [token]);
    };
    //All the rest of the function is exactly the same
    if (!window.grecaptcha && Recaptcha.isScriptLoaded()) {
        CONST.CAPTCHA.EXIGE_CAPTCHA = false;
        settings.completo.apply(null, [null]);
    } else if (!window.grecaptcha) {
        includeJavaScript("https://www.google.com/recaptcha/api.js?render=" + __sGoogleRecaptchaSiteKeyV3, async function () {
            await grecaptcha.ready(async function () {
                await fnExecute.call();
            });
        });
    } else if (window.grecaptcha && typeof window.grecaptcha.execute != "function") {
        grecaptcha.ready(async function () {
            await fnExecute.call();
        });
    } else {
        await fnExecute.call();
    }
    return true;
};