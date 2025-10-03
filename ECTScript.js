// ==UserScript==
// @name         ECTScript
// @namespace    https://github.com/OnlyMaxi/ECTScript
// @version      0
// @description  for free ECTS click here!
// @match        https://tuwel.tuwien.ac.at/course/view.php?id=*
// @match        https://tuwel.tuwien.ac.at/mod/scorm/view.php?id=*
// @match        https://tuwel.tuwien.ac.at/mod/scorm/player.php
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    async function delay(ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    async function tick() {
        await delay(0);
    }

    // can either be 'single' or 'all'
    function setRunningType(type) {
        localStorage.setItem('ECTScript-running', type);
        document.dispatchEvent(new CustomEvent('ECTScript-running-update'));
    }

    // can either be 'single' or 'all'
    function getRunningType() {
        return localStorage.getItem("ECTScript-running");
    }

    function clearRunningType() {
        localStorage.removeItem('ECTScript-running');
        document.dispatchEvent(new CustomEvent('ECTScript-running-update'));
    }

    function scrollDown(element) {
        element.scrollTop = element.scrollHeight;
    }

    function reload() {
        window.location.reload();
    }

    function init() {
        if (window.location.origin !== "https://tuwel.tuwien.ac.at") return;

        function hasCourseTitle() {
            const titles = document.querySelectorAll("h1");
            for (const title of titles) {
                if (!title.innerText) continue;
                if (title.innerText.includes("Diversity Skills")) return true;
            }
            return false;
        }

        function hasCourseBreadcrumb() {
            const breadcrumbs = document.querySelectorAll(".breadcrumb-item > a");
            for (const breadcrumb of breadcrumbs) {
                if (!breadcrumb.title) continue;
                if (breadcrumb.title.includes("Diversity Skills")) return true;
            }
            return false;
        }


        const path = window.location.pathname;

        if (path === "/course/view.php" && hasCourseTitle()) {
            initCoursePage();
        } else if (path === "/mod/scorm/view.php" && hasCourseBreadcrumb()) {
            initStartModulePage();
        } else if (path === "/mod/scorm/player.php" && hasCourseBreadcrumb()) {
            initPlayerPage();
        }
    }

    function initCoursePage() {
        attachStylesheet();

        const controlsElement = createControlsElement({
            startActionHint: 'you will complete all modules automatically',
            startAction: () => {
                setRunningType("all");
                logInfo('Script started for all modules.');
                openNextModule();
            }
        });
        controlsElement.classList.add("section-item");
        controlsElement.style.marginBottom = "1rem";
        document.querySelector("#section-0").prepend(controlsElement);

        if (getRunningType() === 'all') {
            openNextModule();
        }
    }

    function openNextModule() {
        const allSectionItems = document.querySelectorAll(".section-item");
        const allCompletionWrappers = document.querySelectorAll(".dropdown.completion-dropdown");
        const allActivityNameLinks = document.querySelectorAll(".activityname > a");
        for (let i = 0; i < 5; i++) {
            // search for completion
            const currentSection = allSectionItems[i + 3];
            const currentCompletionWrapper = allCompletionWrappers[i];
            const currentCompletion = currentCompletionWrapper.querySelector(":scope > button");
            if (currentCompletion.innerText.includes("Erledigt")) {
                const completedMessage = "Module " + (i + 1) + " completed\n";
                logInfo(completedMessage);
                continue;
            } else {
                if (i == 0) {
                    //allActivityNameLinks[0].click();
                } else if (i == 1) {
                    //allActivityNameLinks[2].click();
                } else if (i == 2) {
                    //allActivityNameLinks[5].click();
                } else if (i == 3) {
                    //allActivityNameLinks[7].click();
                } else if (i == 4) {
                    //allActivityNameLinks[8].click();
                }
            }
        }
    }

    function initStartModulePage() {
        attachStylesheet();

        const moduleName = document.querySelector('h1').innerText.split('"')[1];

        const controlsElement = createControlsElement({
            startActionHint: `you will complete this module automatically: ${moduleName}`,
            startAction: () => {
                setRunningType('single');
                logInfo(`Script started for single module: ${moduleName}`);
                startModule();
            }
        });
        controlsElement.classList.add('activity-header');
        controlsElement.style.padding = '1em';
        document.querySelector('#region-main').prepend(controlsElement);

        if (getRunningType() == 'all') {
            startModule();
        }
    }

    function startModule() {
        const startButton = document.querySelector("#n");
        startButton.click();
    }

    async function initPlayerPage() {
        attachStylesheet();

        const moduleName = document.querySelector('h1').innerText.split('"')[1];

        const controlsElement = createControlsElement({
            startActionHint: `you will complete this module automatically: ${moduleName}`,
            startAction: () => {
                setRunningType('single');
                logInfo(`Script started for single module: ${moduleName}`);
                runPlayer(moduleName);
            }
        });
        controlsElement.classList.add('activity-header');
        controlsElement.style.padding = '1em';
        document.querySelector('#region-main').prepend(controlsElement);

        if (getRunningType()) {
            try {
                await runPlayer(moduleName);
            } catch(e) {
                logError(e);
                clearRunningType();
           }
        }
    }

    function createControlsElement(options) {
        const controlsElement = document.createElement("div");
        controlsElement.id = "ECTSettings";
        controlsElement.innerHTML = `
            <h4 id="ECTScript-heading">ECTScript controls</h4>
            <p>
                <a id="ECTScript-action"></a>
            </p>
            <details open id="ECTScript-messages-wrapper">
                <summary>Messages <a id="ECTScript-messages-clear">(Clear)</a></summary>
                <ul id="ECTScript-messages"></ul>
            </details>
        `;

        controlsElement.querySelector('#ECTScript-messages-clear').addEventListener('click', e => {
            e.preventDefault();
            clearLog(controlsElement);
        });
        loadLog(controlsElement);

        const actionButton = controlsElement.querySelector("#ECTScript-action");

        let action;

        function updateActionButton() {
            if (!getRunningType()) {
                actionButton.innerText = `Start the ECTScript (${options.startActionHint})`;
                actionButton.className = "ECTScript-action-start";
                action = options.startAction;
            } else {
                actionButton.innerText = `Stop the ECTScript`;
                actionButton.className = "ECTScript-action-stop";
                action = () => {
                    clearRunningType();
                    logInfo('Script stopped.')
                    reload();
                };
            }
        }

        document.addEventListener('ECTScript-running-update', () => {
            updateActionButton();
        });

        updateActionButton();

        actionButton.addEventListener("click", () => {
            action();
        });

        return controlsElement;
    }

    function attachStylesheet() {
        const style = document.createElement("style");
        style.textContent = `
            #ECTScript-heading {
                font-weight: normal;
                font-size: 1.3rem;
                margin-bottom: .75em;
            }

            .ECTScript-action-start, #ECTScript-messages-clear {
                color: #006699;
            }

            .ECTScript-action-stop {
                color: #cc0033;
            }

            #ECTScript-action:hover, #ECTScript-messages-clear:hover {
                text-decoration: underline;
                cursor: pointer;
            }

            #ECTScript-messages-wrapper {
                interpolate-size: allow-keywords;
                transition: height 500ms ease;
            }

            #ECTScript-messages-wrapper::details-content {
                transition: height 0.5s ease, content-visibility 0.5s ease allow-discrete;
                height: 0;
                overflow: clip;

                padding-left: .9em;
            }

            #ECTScript-messages-wrapper[open]::details-content {
                height: auto;
            }

            #ECTScript-messages {
                list-style-type: none;
                padding: 0;
                max-height: 10em;
                overflow: auto;
            }

            .ECTScript-message {
                padding-left: .5em;
                font-size: .75em;
                word-break: break-word;
                border-width: 1px;
                border-left-style: solid;
                border-right-style: solid;
            }
            .ECTScript-message:first-child {
                border-top-style: solid;
            }
            .ECTScript-message:last-child {
                border-bottom-style: solid;
            }

            .ECTScript-message-type-info {
                background: var(--bs-info-bg-subtle);
                color: var(--bs-info-text-emphasis);
                border-color: var(--bs-info-border-subtle);
            }

            .ECTScript-message-type-warning {
                background: var(--bs-warning-bg-subtle);
                color: var(--bs-warning-text-emphasis);
                border-color: var(--bs-warning-border-subtle);
            }

            .ECTScript-message-type-error {
                background: var(--bs-danger-bg-subtle);
                color: var(--bs-danger-text-emphasis);
                border-color: var(--bs-danger-border-subtle);
            }

            .ECTScript-message-type-success {
                background: var(--bs-success-bg-subtle);
                color: var(--bs-success-text-emphasis);
                border-color: var(--bs-success-border-subtle);
            }

            .ECTScript-message-time {
                display: inline-block;
                color: grey;
                margin-right: .5em;
            }
        `;
        document.head.appendChild(style);
    }

    function showMessage(message, controlsElement = document) {
        const messageList = controlsElement.querySelector('#ECTScript-messages');
        if (!messageList) return;
        const messageElement = document.createElement('li');
        messageElement.classList.add('ECTScript-message');
        messageElement.classList.add('ECTScript-message-type-' + message.type);
        const timeElement = document.createElement('span');
        timeElement.classList.add('ECTScript-message-time');
        timeElement.innerText = message.date.toLocaleString();
        messageElement.appendChild(timeElement);
        const textElement = document.createElement('span');
        textElement.innerText = message.text;
        messageElement.appendChild(textElement);
        const isScrolled = messageList.scrollTop + messageList.clientHeight >= messageList.scrollHeight - 5;
        messageList.appendChild(messageElement);
        if (isScrolled) {
            scrollDown(messageList);
        }
    }

    function getMessages() {
        let messages;
        try {
            messages = JSON.parse(localStorage.getItem('ECTScript-messages'));
            for (const message of messages) {
                message.date = new Date(message.date);
            }
        } catch (e) {}
        if (!Array.isArray(messages)) {
            messages = [];
        }
        return messages;
    }

    function loadLog(controlsElement) {
        for (const message of getMessages()) {
            showMessage(message, controlsElement);
        }
    }

    function writeLog(message) {
        message.date ??= new Date();

        const messages = getMessages();
        messages.push(message);
        localStorage.setItem('ECTScript-messages', JSON.stringify(messages));

        showMessage(message);
    }

    function logInfo(text) {
        console.log('ECTScript:', text);
        writeLog({ type: 'info', text: `${text}` });
    }

    function logWarning(text) {
        console.warn('ECTScript:', text);
        writeLog({ type: 'warning', text: `${text}` });
    }

    function logError(text) {
        console.error('ECTScript:', text);
        writeLog({ type: 'error', text: `${text}` });
    }

    function logSuccess(text) {
        console.log('%cECTScript:', 'color: #bada55', text);
        writeLog({ type: 'success', text: `${text}` });
    }

    function clearLog(controlsElement = document) {
        localStorage.removeItem('ECTScript-messages');
        controlsElement.querySelector('#ECTScript-messages').innerHTML = '';
    }

    async function waitForSelector(parent, selector, timeout = 5000) {
        const start = Date.now();
        let element;
        while (!(element = parent.querySelector(selector))) {
            await delay(100);
            if (Date.now() - start > timeout) {
                throw new Error('Timeout waiting for element with selector: ' + selector);
            }
        }
        return element;
    }

    async function runPlayer(moduleName) {
        async function clickContinueButton() {
            const continueBtn = page.querySelector(".continue-btn");
            if (continueBtn) {
                continueBtn.click();
                await tick();
                retries = initialRetries;
                return true;
            }
            return false;
        }

        async function clickNextLink() {
            const nextLink = pageWrap.querySelector('.next-lesson__link, [data-link="lesson-link-item"][data-direction="next"]');
            if (nextLink) {
                nextLink.click();
                await tick();
                retries = initialRetries;
                return true;
            }
            return false;
        }

        async function solveFlashCards() {
            if (!page.querySelector(".block-flashcards:not(.ECTScript--done)")) return false; // all flashcards done
            while (page.querySelector(".continue-hint")) {
                const flipIcon = page.querySelector(".flip-icon:not(.ECTScript--done)");
                flipIcon.click();
                flipIcon.classList.add("ECTScript--done");
                const nextArrow = page.querySelector(".block-flashcards-slider__arrow--next");
                if (nextArrow) nextArrow.click(); // sometimes all flashcards are displayed instantly
                scrollDown(page.parentElement);
                await tick();
            }
            retries = initialRetries;
            page.querySelector(".block-flashcards:not(.ECTScript--done)").classList.add("ECTScript--done");
            return true;
        }

        // sometimes the main page needs to be scrolled down or it doesn't register some of the buttons
        scrollDown(document.querySelector("#page"));

        // wait until loaded
        const scormObject = await waitForSelector(document, '#scorm_object');
        const contentFrame = await waitForSelector(scormObject.contentDocument, '#content-frame');
        const app = await waitForSelector(contentFrame.contentDocument, '#app');

        // start from the first lesson
        const firstLessonLink = await waitForSelector(
            app,
            '.lesson-link'
            + ',.overview-list-item__link'
            + ',[data-link="lesson-link-item"]'
        );
        firstLessonLink.click();

        // complete module
        let pageWrap = await waitForSelector(app, '#page-wrap');

        let page;

        const initialRetries = 5;
        let retries = initialRetries;

        while (true) {
            page = await waitForSelector(pageWrap, 'main:first-of-type');
            scrollDown(pageWrap);

            // iterate through each action, if it isn't possible, another action is needed

            if (await clickContinueButton()) continue;
            if (await clickNextLink()) continue;
            if (await solveFlashCards()) continue;



            const activeCardSelector = '.process-card--active';
            const finalCardSelector = '.process-card--summary';
            const activeFinalCardSelector = activeCardSelector + finalCardSelector;
            const processBlock = page.querySelector(`.block-process:not(${activeFinalCardSelector})`);
            if (processBlock) {
                processBlock.querySelector('button, .process-card__button, process-card__start').click();

                while (!processBlock.querySelector(activeFinalCardSelector)) {
                    const activeCard = processBlock.querySelector(activeCardSelector);
                    const tabNext = activeCard.querySelector('.process-counter__item--active + .process-counter__item');
                    tabNext.click();
                    while (activeCard === processBlock.querySelector(activeCardSelector)) {
                        await delay(100);
                        tabNext.click();
                    }
                }
            }

            const quizWrap = page.querySelector('.quiz__wrap');
            if (quizWrap) {
                const fullScore = await solveQuiz(quizWrap);
                if (!fullScore) {
                    throw new Error('Quiz not completed with full score!');
                }
            }

            // basic error prevention: retry 5 times after a delay of 100ms
            if (Number(retries) > 0) {
                retries--;
                await delay(100);
                continue;
            }

            break;
        }

        if (!isLastPage(page)) {
            throw new Error('Nothing to do, but module does not seem completed!');
        }

        // works without it, but just to be sure, the request goes through
        await delay(500);

        logSuccess(`Module completed: ${moduleName}`);
        if (getRunningType() === 'single') {
            clearRunningType();
        } else {
            // close module
            document.querySelector('div[role="main"] .btn[href^="https://tuwel.tuwien.ac.at/course/view.php"]').click();
        }
    }

    function isLastPage(page) {
        const lessonCountText = page.querySelector('.lesson-header__count').innerText;
        const nums = lessonCountText.match(/[0-9]+/g);
        return nums[0] && nums[0] === nums[1];
    }

    function fillReactInput(input, value) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
        for (const event of ['input', 'change']) {
            input.dispatchEvent(new Event(event, { bubbles: true }));
        }
    }

    async function collectQuizCardSolution(quizCard) {
        let solution = null;

        if (quizCard.querySelector('.quiz-multiple-response-option-wrap')) {
            const checkboxes = quizCard.querySelectorAll('.quiz-multiple-response-option');
            for (const checkbox of checkboxes) {
                checkbox.click();
            }

            quizCard.querySelector('.quiz-card__submit > button').click();

            solution = [];
            for (const answer of checkboxes) {
                solution.push(answer.classList.contains('quiz-multiple-response-option--correct'));
            }
        } else if (quizCard.querySelector('.quiz-match')) {
            const draggablesLen = quizCard.querySelectorAll('.quiz-match__item--draggable .quiz-match__item-wrapper').length;
            for (let i = 0; i < draggablesLen; i++) {
                const draggables = quizCard.querySelectorAll('.quiz-match__item--draggable .quiz-match__item-wrapper');
                draggables[i].focus();
                draggables[i].dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true }));

                const droppables = quizCard.querySelectorAll('.quiz-match__item.droppable');
                droppables[i].focus();
                droppables[i].dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true }));
            }

            quizCard.querySelector('.quiz-card__submit > button').click();

            solution = [];
            const answers = quizCard.querySelectorAll('.quiz-match__item-feedback');
            const draggables = quizCard.querySelectorAll('.quiz-match__item--draggable .quiz-match__item-wrapper');
            const droppables = quizCard.querySelectorAll('.quiz-match__item.droppable');
            for (let i = 0; i < answers.length; i++) {
                const bubble = answers[i].querySelector('.quiz-match__item-feedback-bubble');
                const targetIndex = bubble ? parseInt(bubble.innerText) - 1 : i;
                solution.push({
                    origin: draggables[i].querySelector('[data-match-content="true"]').innerText,
                    target: droppables[targetIndex].querySelector('[data-match-content="true"]').innerText,
                });
            }
        } else if (quizCard.querySelector('.quiz-multiple-choice-option-wrap')) {
            const options = quizCard.querySelectorAll('.quiz-multiple-choice-option');

            options[0].click();

            quizCard.querySelector('.quiz-card__submit > button').click();

            solution = [];
            for (let i = 0; i < options.length; i++) {
                const inc = options[i].classList.contains('quiz-multiple-choice-option--incorrect')
                solution.push(!inc);
            }
        } else if (quizCard.querySelector('.quiz-fill')) {
            const input = quizCard.querySelector('.quiz-fill__container > input');
            fillReactInput(input, '-');

            quizCard.querySelector('.quiz-card__submit > button').click();

            const optionsFeedback = quizCard.querySelector('.quiz-fill__options').innerText;
            solution = optionsFeedback.replace(/.*: /, '').split(', ')[0];
        }

        return solution;
    }

    async function applyQuizCardSolution(quizCard, solution) {
        if (quizCard.querySelector('.quiz-multiple-response-option-wrap')) {
            const checkboxes = quizCard.querySelectorAll('.quiz-multiple-response-option');
            for (let i = 0; i < checkboxes.length; i++) {
                if (solution[i]) {
                    checkboxes[i].click();
                }
            }

            quizCard.querySelector('.quiz-card__submit > button').click();

            return true;
        } else if (quizCard.querySelector('.quiz-match')) {
            while (solution.length > 0) {
                const match = solution.shift();

                const draggables = quizCard.querySelectorAll('.quiz-match__item--draggable .quiz-match__item-wrapper');
                const draggable = Array.from(draggables).find(d => d.querySelector('[data-match-content="true"]').innerText === match.origin);
                draggable.focus();
                draggable.dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true }));

                const droppables = quizCard.querySelectorAll('.quiz-match__item.droppable');
                const droppable = Array.from(droppables).find(d => d.querySelector('[data-match-content="true"]').innerText === match.target);
                droppable.focus();
                droppable.dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true }));
            }

            quizCard.querySelector('.quiz-card__submit > button').click();

            return true;
        } else if (quizCard.querySelector('.quiz-multiple-choice-option-wrap')) {
            const options = quizCard.querySelectorAll('.quiz-multiple-choice-option');
            for (let i = 0; i < options.length; i++) {
                if (solution[i]) {
                    options[i].click();
                }
            }

            quizCard.querySelector('.quiz-card__submit > button').click();

            return true;
        } else if (quizCard.querySelector('.quiz-fill')) {
            const input = quizCard.querySelector('.quiz-fill__container > input');
            fillReactInput(input, solution);

            quizCard.querySelector('.quiz-card__submit > button').click();

            return true;
        }

        return false;
    }

    async function solveQuiz(quizWrap) {
        let lastActiveCard = null;
        let activeCard = quizWrap.querySelector('.quiz-item__card--active');

        // restart if needed
        if (!activeCard.querySelector('.quiz-header__container')) {
            quizWrap.querySelector('.restart-button').click();
            lastActiveCard = activeCard;
        }

        // collect solutions
        let solutions = [];
        while (true) {
            await tick();

            let activeCard = quizWrap.querySelector('.quiz-item__card--active');
            if (!activeCard) break;
            if (activeCard === lastActiveCard) {
                await delay(100);
                continue;
            }
            lastActiveCard = activeCard;

            if (activeCard.querySelector('.quiz-header__container')) {
                activeCard.querySelector('.quiz-header__start-quiz').click();
            } else if (activeCard.querySelector('.quiz-results')) {
                // restart quiz
                activeCard.querySelector('.restart-button').click();
                break;
            } else {
                const solution = await collectQuizCardSolution(activeCard);
                if (solution) {
                    activeCard.querySelector('.quiz-card__feedback-button > button').click();

                    solutions.push(solution);
                }
            }
        }

        // run with solutions
        while (true) {
            await tick();

            let activeCard = quizWrap.querySelector('.quiz-item__card--active');
            if (!activeCard) break;
            if (activeCard === lastActiveCard) {
                await delay(100);
                continue;
            }
            lastActiveCard = activeCard;

            if (activeCard.querySelector('.quiz-header__container')) {
                activeCard.querySelector('.quiz-header__start-quiz').click();
            } else if (activeCard.querySelector('.quiz-results')) {
                // done
                break;
            } else {
                const didApply = await applyQuizCardSolution(activeCard, solutions[0]);
                if (didApply) {
                    activeCard.querySelector('.quiz-card__feedback-button > button').click();

                    solutions.shift();
                }
            }
        }

        function getScore() {
            return quizWrap.querySelector('.odometer__score-percent--hidden');
        }
        let score;
        while (!(score = getScore())) {
            await delay(100);
        }
        return score.innerText === '100%';
    }

    async function solveKnowledgeBlock(knowledgeBlock) {
        const solution = await collectQuizCardSolution(knowledgeBlock);

        knowledgeBlock.querySelector('.block-knowledge__retake').click();

        while (knowledgeBlock.querySelector('.quiz-multiple-choice-option-wrap--complete')) {
            await delay(100);
        }

        await applyQuizCardSolution(knowledgeBlock, solution);

        if (!knowledgeBlock.querySelector('.quiz-card__feedback-icon--correct')) {
            return false;
        }

        return true;
    }

    init();
})();
