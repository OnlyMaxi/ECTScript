// ==UserScript==
// @name         ECTScript
// @namespace    https://github.com/OnlyMaxi/ECTScript
// @version      0
// @description  for free ECTS click here!
// @match        https://tuwel.tuwien.ac.at/course/view.php?id=*
// @match        https://tuwel.tuwien.ac.at/mod/scorm/view.php?id=*
// @match        https://tuwel.tuwien.ac.at/mod/scorm/view.php?id=*
// @match        https://tuwel.tuwien.ac.at/mod/scorm/player.php
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

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
            initMainCoursePage();
        } else if (path ===  "/mod/scorm/view.php" && hasCourseBreadcrumb()) {
            startModule();
        } else if (path === "/mod/scorm/player.php" && hasCourseBreadcrumb()) {
            runPlayerPage();
        } else {
            //const hostName = window.location.hostname;
            //const pathName = window.location.pathname;
            if (window.location.hostname !== "localhost") {
                console.log("ECTScript: ERROR!\n    this URL is not supported, are you on the right page?");
            } else {
                console.log("ECTScript: TESTING!\n    You are currently testing this script on a mock page.");

                if (window.location.pathname === "/ECTScript/mock%20website/mainPage.html") {
                    initMainCoursePage();
                }
            }
        }
        console.log(localStorage.getItem("ECTScript-manually"));
        console.log(localStorage.getItem("ECTScript-running"));
    }

    function initMainCoursePage() {
        const scriptControlSectionItem = document.createElement("div")
        scriptControlSectionItem.classList.add("section-item");
        scriptControlSectionItem.id = "ECTScript-control"
        scriptControlSectionItem.style.marginBottom = "1rem";
        scriptControlSectionItem.innerHTML = `
            <div>
              ECTScript controls
            </div>
            <div>
              <span>
                <span class="ECTScript-start" id="startAutomatically">
                  Start the script with full automation (You will complete the course almost instantly)
                </span>
              </span>
              <div></div>
              <span>
                <span class="ECTScript-start" id="startManually">
                  Start the script with manual completion (You have to continue manually after tests)
                </span>
              </span>
            </div>
        `;

        scriptControlSectionItem.children[0].style.fontSize = "1.3rem";
        scriptControlSectionItem.children[1].style.color = "#0077ff";

        const firstSectionItem = document.querySelector(".section-item");
        firstSectionItem.parentElement.insertBefore(scriptControlSectionItem, firstSectionItem);

        document.querySelector("#startAutomatically").addEventListener("click", () => {
            localStorage.setItem("ECTScript-running", "true");
            localStorage.setItem("ECTScript-manually", "false");
            runMainCoursePage();
        });
        document.querySelector("#startManually").addEventListener("click", () => {
            runMainCoursePage();
            localStorage.setItem("ECTScript-running", "true");
            localStorage.setItem("ECTScript-manually", "true");
        });
    }

    function runMainCoursePage() {
        const allSectionItems = document.querySelectorAll(".section-item");
        const allCompletionWrappers = document.querySelectorAll(".dropdown.completion-dropdown");
        const allActivityNameLinks = document.querySelectorAll(".activityname > a");
        if (allSectionItems.length !== 9) {
            console.log("ECTScript: ERROR!\n    Not the right amount of sections, you might be in the wrong course!");
            return;
        }
        for (let i = 0; i < 5; i++) {
            //search for completion
            const currentSection = allSectionItems[i + 3];
            const currentCompletionWrapper = allCompletionWrappers[i];
            const currentCompletion = currentCompletionWrapper.querySelector(':scope > button');
            if (currentCompletion.innerText.includes("Erledigt")) {
                const completedMessage = document.createElement("div");
                completedMessage.innerText = "Module " + (i + 1) + " completed";
                document.querySelector("#ECTScript-control").appendChild(completedMessage);
                console.log("ECTScript: COMPLETED!\n    module " + (i + 1) + " completed!");
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
        if (!Boolean(localStorage.getItem("ECTScript-manually"))) {
            const startButton = document.querySelector("#n");
            startButton.click();
        }
    }

    function runDiversityBasicsContent() {
        const nextLesson = document.querySelecter(".next-lesson__link");
    }

    async function delay(ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    async function tick() {
        await delay(0);
    }

    async function runPlayerPage() {
        const running = localStorage.getItem("ECTScript-manually") || localStorage.getItem("ECTScript-running");
        if (!running) return;

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
        while (true) {
            page = app.querySelector('#page-wrap > main:first-of-type');
            while (!page) {
                await delay(100);
            }
            page.parentElement.scrollBy(0, 100000);

            await tick();

            const knowledgeBlock = page.querySelector('.block-knowledge:not(.block-knowledge--answered)');
            if (knowledgeBlock) {
                const didSolve = await solveKnowledgeBlock(knowledgeBlock);
                if (!didSolve) {
                    // todo: better error handling
                    console.error('Knowledge block not completed correctly!');
                    return;
                }
            }

            const nextCardSelector = '.block-flashcards-slider__arrow--next:not([aria-disabled="true"])';
            const flashcards = page.querySelector(`.block-flashcards-slider__wrap:not(${nextCardSelector})`);
            if (flashcards) {
                let flashcardNext;
                while (flashcardNext = page.querySelector(nextCardSelector)) {
                    const activeCard = flashcards.querySelector('.slick-active');
                    activeCard.querySelector('.block-flashcard__front').click();
                    flashcardNext.click();
                    await tick();
                }
            }

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

            const nextLink = page.querySelector('.next-lesson__link');
            if (nextLink) {
                nextLink.click();
                continue;
            }

            const continueBtn = page.querySelector('.continue-btn');
            if (continueBtn) {
                continueBtn.click();
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
