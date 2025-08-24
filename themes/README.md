# PowerPoint Theme Installation for Sony Internal Distribution

## 🎯 Copying Actual Microsoft PowerPoint Themes

Since this is for internal Sony distribution, you can legally copy Microsoft's PowerPoint theme files (.thmx) for internal use.

### Theme File Locations:

**Windows 10/11 with Office 365/2019/2021:**
```
C:\Program Files\Microsoft Office\root\Document Themes 16\
```

**32-bit Office Installation:**
```
C:\Program Files (x86)\Microsoft Office\root\Document Themes 16\
```

**User-Installed Themes:**
```
%USERPROFILE%\AppData\Roaming\Microsoft\Templates\Document Themes\
```

**Alternative Location (Office 2016/2019):**
```
%PROGRAMFILES%\Microsoft Office\Document Themes 16\
```

### Step-by-Step Copy Process:

1. **Open File Explorer**
2. **Navigate to theme directory** (try each location above until you find .thmx files)
3. **Select all .thmx files** (Ctrl+A in the theme folder)
4. **Copy files** (Ctrl+C)
5. **Navigate to your PowerPoint Generator project**
6. **Go to themes/ folder**
7. **Paste .thmx files** (Ctrl+V)

### Common PowerPoint Themes to Copy:

**Professional Themes:**
- Facet.thmx (Corporate blue theme)
- Ion.thmx (Modern design with bold colors)
- Retrospect.thmx (Clean professional theme)
- Savon.thmx (Elegant minimalist design)
- Celestial.thmx (Modern corporate theme)

**Creative Themes:**
- Badge.thmx (Creative color scheme)
- Banded.thmx (Modern with accent bands)
- Berlin.thmx (Contemporary design)
- Dividend.thmx (Financial/business theme)
- Facet.thmx (Professional with blue accents)

**Executive Themes:**
- Quotable.thmx (Clean executive style)
- Vapor Trail.thmx (Sophisticated gradient design)
- Wood Type.thmx (Traditional professional)
- Slice.thmx (Modern geometric design)

### After Copying Themes:

1. **Verify themes folder contains .thmx files**
2. **Rebuild the distribution:**
   ```bash
   npm run build-win
   ```
3. **Test theme selection in Configuration tab**
4. **Confirm PowerPoint generation applies selected themes**

### Legal Notes for Sony:
- ✅ Internal corporate use is permitted
- ✅ No redistribution outside Sony
- ✅ Themes remain Microsoft's intellectual property
- ✅ Used for business productivity purposes only

### File Structure After Copying:
```
themes/
├── themes.json (configuration file)
├── Facet.thmx (professional theme)
├── Ion.thmx (modern theme)
├── Retrospect.thmx (clean theme)
├── Savon.thmx (minimalist theme)
├── Celestial.thmx (corporate theme)
├── Badge.thmx (creative theme)
└── [other .thmx files]
```

### Testing Theme Integration:
1. Open PowerPoint Generator
2. Go to Configuration tab
3. Select "PowerPoint Theme Selection"
4. Choose a theme from dropdown
5. Generate a presentation
6. Verify theme is applied correctly

The app will automatically track the 10 minutes saved per presentation by eliminating manual theme application.
