const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto('http://localhost:8000/index.html');

        // Add some test data via console
        await page.evaluate(() => {
            const entry = {
                id: Date.now(),
                datetime: 'Thursday, June 26, 2025  —  14:35',
                title: 'Test Entry',
                content: 'Testing the backup feature!'
            };
            let entries = JSON.parse(localStorage.getItem('diary_journal') || '[]');
            entries.unshift(entry);
            localStorage.setItem('diary_journal', JSON.stringify(entries));
        });

        // Reload to show the data
        await page.reload();

        // Take screenshot of the full page
        await page.screenshot({ path: 'app-screenshot.png', fullPage: true });

        console.log('✅ Screenshot saved: app-screenshot.png');

        await browser.close();
    } catch (error) {
        console.log('⚠️  Puppeteer not available. App is running on http://localhost:8000');
        console.log('   Open in browser to test manually.');
    }
})();
