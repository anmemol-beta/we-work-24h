# Images

Drop photos here, then reference them from any entry's markdown:

```markdown
![alt text](filename.jpg)
```

The build plugin resolves the path to the deployed location (handles the
GitHub Pages base prefix automatically) and fails the build if the file is
missing, so a broken `![]()` reference can never reach the live site.

External URLs (`https://...`) and data URLs pass through untouched.
