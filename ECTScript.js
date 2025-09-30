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

    function checkIfScriptRunning() {
        const running = localStorage.getItem("ECTScript-running");
        return running === "true";
    }

    function scrollDown(element) {
        element.scrollTop = element.scrollHeight;
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
            startModule();
        } else if (path === "/mod/scorm/player.php" && hasCourseBreadcrumb()) {
            runPlayerPage();
        }
    }

    function initCoursePage() {
        //create settings div
        const scriptControlSectionItem = document.createElement("div")
        scriptControlSectionItem.classList.add("section-item");
        scriptControlSectionItem.id = "ECTSettings"
        scriptControlSectionItem.style.marginBottom = "1rem";
        scriptControlSectionItem.innerHTML = `
            <div id="ECTScript-heading">
              ECTScript controls
            </div>
            <div>
                <span id="ECTScript-start">
                  Start the ECTScript (you will complete all modules automatically)
                </span>
            </div>
            <div id="ECTScript-messages"> </div>
        `;


        const style = document.createElement("style");
        style.textContent = `
            #ECTScript-heading {
                font-size: 1.3rem;
            }
            
            #ECTScript-start {
                color: #006699;
            }
            
            #ECTScript-start:hover {
                text-decoration: underline;
                cursor: pointer;
            }
            
            #ECTScript-messages {
                color: #33bb33;
            }
        `;

        //apply style and controls element
        document.head.appendChild(style);
        document.querySelector("#section-0").prepend(scriptControlSectionItem);

        //add event listener to start the script
        document.querySelector("#ECTScript-start").addEventListener("click", () => {
            localStorage.setItem("ECTScript-running", "true");
            runCoursePage();
        });
    }

    function runCoursePage() {
        const allSectionItems = document.querySelectorAll(".section-item");
        const allCompletionWrappers = document.querySelectorAll(".dropdown.completion-dropdown");
        const allActivityNameLinks = document.querySelectorAll(".activityname > a");
        for (let i = 0; i < 5; i++) {
            //search for completion
            const currentSection = allSectionItems[i + 3];
            const currentCompletionWrapper = allCompletionWrappers[i];
            const currentCompletion = currentCompletionWrapper.querySelector(":scope > button");
            if (currentCompletion.innerText.includes("Erledigt")) {
                const completedMessage = "Module " + (i + 1) + " completed\n";
                const messages = document.querySelector("#ECTScript-messages");
                if (!messages.innerText.includes(completedMessage)) {
                    messages.innerText += completedMessage;
                }
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

    function startModule() {
        if (!checkIfScriptRunning()) return;

        const startButton = document.querySelector("#n");
        startButton.click();
    }

    async function runPlayerPage() {
        if (!checkIfScriptRunning()) return;

        async function clickContinueButton() {
            if (!checkIfScriptRunning()) return false;
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
            if (!checkIfScriptRunning()) return false;
            const nextLink = page.querySelector(".next-lesson__link");
            if (nextLink) {

                nextLink.click();
                await tick();
                retries = initialRetries;
                return true;
            }
            return false;
        }

        async function solveFlashCards() {
            if (!checkIfScriptRunning()) return false;
            if (!page.querySelector(".block-flashcards:not(.ECTScript--done)")) return false; //all flashcards done
            while (page.querySelector(".continue-hint")) {
                const flipIcon = page.querySelector(".flip-icon:not(.ECTScript--done)");
                flipIcon.click();
                flipIcon.classList.add("ECTScript--done");
                const nextArrow = page.querySelector(".block-flashcards-slider__arrow--next");
                if (nextArrow) nextArrow.click(); //sometimes all flashcards are displayed instantly
                scrollDown(page.parentElement);
                await tick();
            }
            retries = initialRetries;
            page.querySelector(".block-flashcards:not(.ECTScript--done)").classList.add("ECTScript--done");
            return true;
        }

        //sometimes the main page needs to be scrolled down or it doesn't register some of the buttons
        scrollDown(document.querySelector("#page"));

        // wait until loaded
        function getApp() {
            const so = document.querySelector('#scorm_object');
            if (!so) return null;
            const cf = so.contentDocument.querySelector('#content-frame');
            if (!cf) return null;
            return cf.contentDocument.querySelector('#app')
        }

        let app;
        while (!(app = getApp())) {
            await delay(100);
        }

        // start from the first lesson
        function getFirstLessonLink() {
            return app.querySelector('.lesson-lists__list > li:first-of-type a')
                || app.querySelector('.overview-list__list > li:first-of-type a');
        }
        let firstLessonLink;
        while (!(firstLessonLink = getFirstLessonLink())) {
            await delay(100);
        }
        firstLessonLink.click();

        // complete module
        let page;

        const initialRetries = 5;
        let retries = initialRetries;

        while (true) {
            if (!checkIfScriptRunning()) return;
            page = app.querySelector('#page-wrap > main:first-of-type');
            while (!page) {
                await delay(100);
            }
            scrollDown(page.parentElement);

            //iterate through each action, if it isn't possible, another action is needed

            if (await clickContinueButton()) continue;
            if (await clickNextLink()) continue;
            if (await solveFlashCards()) continue;



            const activeCardSelector = '.process-card--active';
            const finalCardSelector = '.process-card--summary';
            const activeFinalCardSelector = activeCardSelector + finalCardSelector;
            const processBlock = page.querySelector(`.block-process:not(${activeFinalCardSelector})`);
            if (processBlock) {
                processBlock.querySelector('.process-card__button').click();

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
                    // todo: better error handling
                    console.error('Quiz not completed with full score!');
                    return;
                }
            }

            //basic error prevention: retry 5 times after a delay of 100ms
            if (Number(retries) > 0) {
                retries--;
                await delay(100);
                continue;
            }

            break;
        }

        if (!isLastPage(page)) {
            // todo: better error handling
            console.error('Nothing to do, but module does not seem completed!');
            return;
        }

        // works without it, but just to be sure, the request goes through
        await delay(500);

        // close module
        document.querySelector('div[role="main"] .btn[href^="https://tuwel.tuwien.ac.at/course/view.php"]').click();
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