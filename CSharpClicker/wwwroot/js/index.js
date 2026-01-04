document.addEventListener('DOMContentLoaded', function () {
    console.log("CSharpClicker: Script loaded");

    // --- ИСПРАВЛЕННАЯ ФУНКЦИЯ ФОРМАТИРОВАНИЯ ---
    function formatCompactNumber(number) {
        if (number < 1000) return Math.floor(number);

        // K: 1,000 - 999,999
        if (number < 1000000) {
            return formatValue(number, 1000, "K");
        }

        // M: 1,000,000 - 999,999,999
        if (number < 1000000000) {
            return formatValue(number, 1000000, "M");
        }

        // B: 1,000,000,000+
        if (number < 1000000000000) {
            return formatValue(number, 1000000000, "B");
        }

        return formatValue(number, 1000000000000, "T");
    }

    function formatValue(number, divisor, suffix) {
        let value = number / divisor;

        // Округляем до 2 знаков, но parseFloat уберет лишние нули (1.50 -> 1.5)
        let shortValue = parseFloat(value.toFixed(2));

        // Если число >= 100 (например 290.5M), округляем до целого для красоты (291M)
        if (shortValue >= 100) {
            shortValue = Math.round(shortValue);
        }

        return shortValue + suffix;
    }
    // ----------------------------------------------

    const connection = new signalR.HubConnectionBuilder()
        .withUrl('/clickerHub')
        .withAutomaticReconnect()
        .build();

    connection.start()
        .then(function () {
            console.log('SignalR: Connected');
        })
        .catch(function (err) {
            return console.error('SignalR Error:', err.toString());
        });

    connection.on('ScoreUpdated', function (current, record) {
        const currentScoreElement = document.getElementById('currentScore');
        const recordScoreElement = document.getElementById('recordScore');

        if (currentScoreElement) {
            currentScoreElement.setAttribute('data-val', current);
            currentScoreElement.textContent = formatCompactNumber(current);
        }

        if (recordScoreElement) {
            recordScoreElement.setAttribute('data-val', record);
            recordScoreElement.textContent = formatCompactNumber(record);
        }

        updateBoostsAvailability();
    });

    connection.on('ProfitUpdated', function (profitPerClick, profitPerSecond) {
        const profitPerClickElement = document.getElementById('profitPerClick');
        const profitPerSecondElement = document.getElementById('profitPerSecond');

        if (profitPerClickElement) profitPerClickElement.textContent = formatCompactNumber(profitPerClick);
        if (profitPerSecondElement) profitPerSecondElement.textContent = formatCompactNumber(profitPerSecond);
    });

    connection.on('BoostUpdated', function (boostId, quantity, currentPrice, nextProfit) {
        const boostElement = document.querySelector(`[data-boost-id="${boostId}"]`);

        if (boostElement) {
            const priceElement = boostElement.querySelector('[data-boost-price]');
            const quantityElement = boostElement.querySelector('[data-boost-quantity]');
            const profitElement = boostElement.querySelector('[data-boost-profit]');

            if (priceElement) {
                priceElement.setAttribute('data-boost-price', currentPrice);
                priceElement.textContent = formatCompactNumber(currentPrice);
            }
            if (quantityElement) quantityElement.textContent = quantity;
            if (profitElement) profitElement.textContent = formatCompactNumber(nextProfit);

            boostElement.style.borderColor = "#ffc107";
            setTimeout(() => boostElement.style.borderColor = "transparent", 300);

            updateBoostsAvailability();
        }
    });

    const clickButton = document.getElementById('click-item');
    if (clickButton) {
        clickButton.addEventListener('click', async function () {
            try {
                await connection.invoke('RegisterClicks', 1);
            } catch (err) {
                console.error("Click Error:", err);
            }
        });
    }

    const boostCards = document.querySelectorAll('.boost-card');

    boostCards.forEach(function (card) {
        const boostId = card.getAttribute('data-boost-id');
        const buyButton = card.querySelector('.buy-boost-button');

        if (buyButton) {
            buyButton.addEventListener('click', async function (e) {
                e.preventDefault();

                if (buyButton.disabled) return;

                try {
                    await connection.invoke('BuyBoost', parseInt(boostId, 10));
                } catch (err) {
                    console.error("Buy Error:", err);
                }
            });
        }
    });

    updateBoostsAvailability();

    function updateBoostsAvailability() {
        const currentScoreElement = document.getElementById('currentScore');
        if (!currentScoreElement) return;

        const rawScore = currentScoreElement.getAttribute('data-val');
        const currentScore = parseInt(rawScore, 10) || 0;

        const cards = document.querySelectorAll('.boost-card');

        cards.forEach(function (card) {
            const priceElement = card.querySelector('[data-boost-price]');
            const buyButton = card.querySelector('.buy-boost-button');

            if (priceElement && buyButton) {
                const rawPrice = priceElement.getAttribute('data-boost-price');
                const price = parseInt(rawPrice, 10);

                if (currentScore < price) {
                    card.classList.add('disabled');
                    buyButton.disabled = true;
                    buyButton.style.cursor = "not-allowed";
                    buyButton.style.opacity = "0.5";
                } else {
                    card.classList.remove('disabled');
                    buyButton.disabled = false;
                    buyButton.style.cursor = "pointer";
                    buyButton.style.opacity = "1";
                }
            }
        });
    }
});