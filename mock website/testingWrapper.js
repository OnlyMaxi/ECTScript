console.log("ETCScript: LOADED\n    (will execute in 1000ms)");
setTimeout(() => {
    console.log("ETCScript: EXECUTED");
    window.ECTScript.init();
}, 1000);