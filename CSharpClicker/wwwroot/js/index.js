document.addEventListener('DOMContentLoaded', function () {
    console.log("CSharpClicker: Script loaded");

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

        if (currentScoreElement) currentScoreElement.textContent = current;
        if (recordScoreElement) recordScoreElement.textContent = record;

        updateBoostsAvailability();
    });

    connection.on('ProfitUpdated', function (profitPerClick, profitPerSecond) {
        const profitPerClickElement = document.getElementById('profitPerClick');
        const profitPerSecondElement = document.getElementById('profitPerSecond');

        if (profitPerClickElement) profitPerClickElement.textContent = profitPerClick;
        if (profitPerSecondElement) profitPerSecondElement.textContent = profitPerSecond;
    });

    // Добавлен аргумент nextProfit
    connection.on('BoostUpdated', function (boostId, quantity, currentPrice, nextProfit) {
        const boostElement = document.querySelector(`[data-boost-id="${boostId}"]`);

        if (boostElement) {
            const priceElement = boostElement.querySelector('[data-boost-price]');
            const quantityElement = boostElement.querySelector('[data-boost-quantity]');
            const profitElement = boostElement.querySelector('[data-boost-profit]'); // Находим элемент профита

            if (priceElement) priceElement.textContent = currentPrice;
            if (quantityElement) quantityElement.textContent = quantity;
            if (profitElement) profitElement.textContent = nextProfit; // Обновляем профит

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

    // Ищем все карточки бустов
    const boostCards = document.querySelectorAll('.boost-card');
    console.log(`Found ${boostCards.length} boost cards`);

    boostCards.forEach(function (card) {
        const boostId = card.getAttribute('data-boost-id');
        const buyButton = card.querySelector('.buy-boost-button');

        if (buyButton) {
            buyButton.addEventListener('click', async function (e) {
                e.preventDefault();

                if (buyButton.disabled) return;

                console.log(`Buying boost ID: ${boostId}`);

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

        const currentScore = parseInt(currentScoreElement.textContent.replace(/[^0-9]/g, ''), 10) || 0;
        const cards = document.querySelectorAll('.boost-card');

        cards.forEach(function (card) {
            const priceElement = card.querySelector('[data-boost-price]');
            const buyButton = card.querySelector('.buy-boost-button');

            if (priceElement && buyButton) {
                const price = parseInt(priceElement.textContent.replace(/[^0-9]/g, ''), 10);

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