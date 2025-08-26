import React from "react";

import { Button } from "@mtrifonov-design/pinsandcurves-design";

const COOKIE_CONSENT_VERSION = 1;


function CookieBanner() {


    const [choiceMade, setChoiceMade] = React.useState(false);

    function acceptCookies() {
        localStorage.setItem('pinsandcurvescookieconsent', JSON.stringify({
            consent: true,
            date: new Date().toISOString(),
            version: 1,
        }));
        const id = crypto.randomUUID();
        localStorage.setItem('pinsandcurves-visitor-id', JSON.stringify({
            id: id,
            date: new Date().toISOString(),
            version: 1,
        }));
        if (window.op) {
            window.op('identify', {
                profileId: id,
            })
            window.op('track', 'cookie_consent_accepted');
        }
        setChoiceMade(true);
    }
    function declineCookies() {
        localStorage.setItem('pinsandcurvescookieconsent', JSON.stringify({
            consent: false,
            date: new Date().toISOString(),
            version: 1,
        }));
        if (window.op) {
            window.op('track', 'cookie_consent_declined');
        }
        setChoiceMade(true);
    }


    if (choiceMade) {
        return null;
    }

    if (localStorage.getItem('pinsandcurvescookieconsent')) {
        const consent = JSON.parse(localStorage.getItem('pinsandcurvescookieconsent') || '{}');
        if (consent.version === COOKIE_CONSENT_VERSION) {
            return null;
        }
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: "10px",
            right: "10px",
            backgroundColor: 'var(--gray2)',
            border: '2px solid var(--gray4)',
            borderRadius: 'var(--borderRadiusSmall)',
            padding: '20px',
            zIndex: 1000,
            boxShadow: '0 -2px 5px rgba(0,0,0,0.1)',
            color: 'var(--gray7)',
            width: '400px',
            display: 'flex',
            gap: '20px',
            flexDirection: 'column',
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '10px',
                fontSize: '1.5em',
            }}>
                <div className="materialSymbols" style={{
                    fontSize: '30px',
                    color: 'var(--gray6)',
                }}>cookie</div>
                <b>We use cookies</b><br />
            </div>

            This site (run.pinsandcurves.app) uses cookies to recognise returning visits
            and understand how the app is used. This helps us improve the experience.
            We do not use cookies for advertising. If we ever add new purposes,
            we'll update this notice and ask for your consent again.
            Only essential cookies are turned on by default.

            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '10px',
                justifyContent: 'flex-end',
            }}>
                <a href="https://pinsandcurves.app/privacy">Privacy Policy</a>
                <Button text="Decline" onClick={declineCookies} />
                <Button text="Accept" onClick={acceptCookies} />
            </div>
        </div>
    )
}

function getCookieId() {
    // check if consent cookie exists
    const consent = localStorage.getItem('pinsandcurvescookieconsent');
    if (!consent) {
        return null;
    }
    const parsedConsent = JSON.parse(consent);
    if (!parsedConsent.consent) {
        return null;
    }
    const visitorId = localStorage.getItem('pinsandcurves-visitor-id');
    if (visitorId) {
        const { id } = JSON.parse(visitorId);
        return id;
    }
    return null;
}

export { CookieBanner, getCookieId };