/**
 * Shared email styles.
 *
 * These mirror the SmartAlert design tokens defined in the PRD (brand indigo
 * #4F46E5, the session status colours, Slate surfaces) so an alert in a
 * student's inbox is recognisably the same product as the alert in the app.
 * Styles are inlined in a <style> block and kept simple because these are read
 * on entry-level Android mail clients.
 */
export const commonStyles = `
body {
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    line-height: 1.55;
    color: #0F172A;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #F8FAFC;
}
.header {
    background: #4F46E5;
    color: #fff;
    padding: 24px 16px;
    text-align: center;
    border-radius: 12px 12px 0 0;
}
.header h1 {
    margin: 0;
    font-size: 20px;
    letter-spacing: 0.2px;
}
.content {
    padding: 20px;
    background-color: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-top: none;
    border-radius: 0 0 12px 12px;
}
.session-card {
    padding: 12px 14px;
    background-color: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-left: 4px solid #4F46E5;
    border-radius: 8px;
    margin: 16px 0;
}
.session-card.cancelled {
    border-left-color: #EF4444;
}
.session-card.rescheduled {
    border-left-color: #F59E0B;
}
.course-code {
    font-family: 'JetBrains Mono', Consolas, Menlo, monospace;
    font-size: 16px;
    font-weight: bold;
    color: #0F172A;
}
.detail {
    margin: 4px 0;
    font-size: 14px;
    color: #64748B;
}
.detail .value {
    font-family: 'JetBrains Mono', Consolas, Menlo, monospace;
    color: #0F172A;
}
.detail .struck {
    text-decoration: line-through;
    color: #64748B;
}
.badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
    color: #ffffff;
}
.badge.cancelled { background-color: #EF4444; }
.badge.rescheduled { background-color: #F59E0B; }
.button {
    display: inline-block;
    padding: 10px 20px;
    background-color: #4F46E5;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 8px;
    margin: 16px 0 6px;
    font-weight: bold;
}
.footer {
    padding: 16px 8px;
    text-align: center;
    font-size: 12px;
    color: #64748B;
}
`;

export const commonFooter = `
<div class="footer">
    <p>SmartAlert — Department of Computer Science, University of Benin</p>
    <p>You are receiving this because you are enrolled in this course on SmartAlert.</p>
</div>`;
