# Traffic Camera Monitor - Desktop Application

A professional Electron-based desktop application for monitoring traffic cameras and analyzing vehicle data in real-time. This application provides a comprehensive dashboard for urban traffic management with an intuitive, modern interface.

## 🚀 Features

### Core Functionality
- **Real-time Dashboard**: Monitor up to 4 traffic cameras simultaneously in a responsive grid layout
- **Advanced Filtering**: Search cameras by code, location, or filter by region (North, Central, South)
- **Live Metrics**: Real-time vehicle counting with breakdown by type (motorcycles, cars, trucks)
- **Multi-line Analysis**: Track vehicles across multiple lanes/lines per camera
- **Alert System**: Automated notifications for high traffic conditions
- **Historical Data**: View traffic patterns over time with interactive charts

### User Interface
- **Modern Design**: Clean, professional interface with traffic management theme
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Responsive Layout**: Adapts to different window sizes and screen resolutions
- **Intuitive Navigation**: Easy-to-use sidebar with quick access to all features
- **Full-screen Mode**: Detailed view for individual cameras

### Data Management
- **Export Functionality**: Download traffic data as CSV files
- **Local Storage**: Persistent settings and preferences
- **Mock Data Integration**: Simulated backend with realistic traffic patterns
- **Auto-refresh**: Configurable automatic data updates

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone or download the project files**
   ```bash
   cd "Traffic Detection using YOLO/Desktop App"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

   For development with DevTools:
   ```bash
   npm run dev
   ```

### Building for Production

To create distributable packages:

```bash
# Build for current platform
npm run build

# Create installer packages
npm run pack
```

## 📁 Project Structure

```
Desktop App/
├── main.js                 # Electron main process
├── preload.js             # Secure IPC bridge
├── index.html             # Main UI structure
├── styles.css             # Complete styling
├── renderer.js            # Frontend logic and interactions
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🎯 Usage Guide

### Dashboard Navigation

1. **Main Dashboard**
   - View all active cameras in a 2x2 grid
   - Each camera shows live feed (simulated) and real-time metrics
   - Color-coded status indicators (green = normal, red = high traffic)

2. **Sidebar Controls**
   - **Search**: Filter cameras by code (CAM-001) or location
   - **Region Filter**: Show cameras from specific regions
   - **Vehicle Type Filter**: Focus on specific vehicle types
   - **Quick Stats**: System overview with totals

3. **Camera Interactions**
   - **Hover Effects**: Reveal video controls overlay
   - **Full-screen**: Click expand button for detailed view
   - **Refresh**: Update individual camera data
   - **Snapshot**: Save current frame (simulated)

### Tabs and Features

#### Dashboard Tab
- Live camera feeds with metrics
- Real-time vehicle counting
- Line-by-line analysis
- Status indicators and alerts

#### History Tab
- Interactive charts showing traffic patterns
- Selectable time ranges (1h, 24h, 7d)
- Multiple data series (vehicle count, average speed)
- Camera-specific or combined data views

#### Alerts Tab
- Real-time alert notifications
- Categorized by severity (high, medium, low)
- Historical alert log
- Clear all functionality

#### Settings Tab
- **Display Settings**: Refresh rate, alert thresholds
- **Camera Settings**: Video quality, timestamp overlay
- **Data Management**: Export, clear local data
- **Theme Toggle**: Light/dark mode switching

### Keyboard Shortcuts

- `Ctrl + R`: Refresh all data
- `Ctrl + E`: Export current data
- `Ctrl + F`: Focus search bar
- `F11`: Toggle full-screen (individual cameras)
- `Ctrl + ,`: Open settings

## 🔧 Configuration

### Settings Options

- **Refresh Rate**: 5-60 seconds (default: 10s)
- **Alert Threshold**: 50-500 vehicles (default: 100)
- **Sound Alerts**: Enable/disable audio notifications
- **Auto Refresh**: Toggle automatic data updates
- **Video Quality**: Low (480p), Medium (720p), High (1080p)
- **Show Timestamp**: Overlay timestamp on video feeds

### Mock Data Configuration

The application currently uses simulated data. To integrate with real backend:

1. Replace mock functions in `renderer.js`
2. Update IPC handlers in `main.js`
3. Configure API endpoints and authentication

## 🌐 Backend Integration

### Expected Data Format

#### Camera List
```json
[
  {
    "id": "CAM-001",
    "name": "Camera Name",
    "location": "Street Address",
    "region": "north|central|south",
    "status": "online|offline|maintenance",
    "lines": 3
  }
]
```

#### Metrics Data
```json
{
  "cameraId": "CAM-001",
  "totalVehicles": 150,
  "timestamp": "2023-12-07T10:30:00Z",
  "status": "normal|alert",
  "lines": [
    {
      "id": 1,
      "total": 25,
      "types": {
        "motorcycle": 15,
        "car": 8,
        "truck": 2
      }
    }
  ]
}
```

### IPC Communication

The application uses Electron's IPC for secure communication:

```javascript
// In renderer process
const metrics = await window.electronAPI.getMetrics(cameraId);
const cameras = await window.electronAPI.getCameraList();

// In main process
ipcMain.handle('getMetrics', async (event, cameraId) => {
  // Your backend integration here
  return await fetchMetricsFromAPI(cameraId);
});
```

## 🎨 Customization

### Color Scheme
The application uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #003366;    /* Deep blue */
  --secondary-color: #0066cc;  /* Medium blue */
  --accent-green: #00cc66;     /* Success/normal */
  --accent-red: #ff3333;       /* Alerts/errors */
  --accent-orange: #ff9900;    /* Warnings */
}
```

### Adding New Features

1. **New Tab**: Add tab button in sidebar and content area in HTML
2. **New Metrics**: Extend the metrics data structure and UI components
3. **New Alerts**: Add alert types in the notification system
4. **New Charts**: Use Chart.js for additional visualizations

## 🔍 Troubleshooting

### Common Issues

1. **Application won't start**
   - Ensure Node.js is installed (v16+)
   - Run `npm install` to install dependencies
   - Check for port conflicts

2. **Data not loading**
   - Verify mock data generators are working
   - Check browser console for errors
   - Ensure IPC communication is functioning

3. **Performance issues**
   - Reduce refresh rate in settings
   - Close unnecessary applications
   - Check system resources

4. **Display issues**
   - Try toggling theme (light/dark)
   - Resize window to trigger responsive layout
   - Clear browser cache (Ctrl + Shift + Delete)

### Development Mode

Run with DevTools for debugging:
```bash
npm run dev
```

Check console logs in:
- Main process: Terminal/Command Prompt
- Renderer process: DevTools Console

## 📊 Performance Optimization

### Recommended Settings
- Refresh rate: 10-30 seconds for production
- Max cameras: 4-6 for optimal performance
- Chart data points: Limit to 100-200 for smooth rendering
- Image quality: Medium (720p) for balance of quality and performance

### Memory Management
- Automatic cleanup of old alerts (50 max)
- Efficient DOM updates using targeted rendering
- Chart data recycling for history views
- Proper event listener cleanup

## 🔐 Security Considerations

- Context isolation enabled for renderer process
- Node integration disabled in browser windows
- Secure IPC communication through preload script
- Input validation and sanitization
- No direct file system access from renderer

## 📄 License

MIT License - See package.json for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📞 Support

For technical support or feature requests:
- Check the troubleshooting section
- Review console logs for errors
- Document steps to reproduce issues
- Include system specifications and Node.js version

---

**Note**: This application currently uses simulated data for demonstration purposes. Integration with actual traffic camera systems and YOLO detection models requires backend API development.
