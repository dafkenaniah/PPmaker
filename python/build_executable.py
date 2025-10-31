#!/usr/bin/env python3
"""
Build script to create a standalone executable from the Flask server
This ensures users don't need to install Python or dependencies
"""
import subprocess
import sys
import os
import shutil
from pathlib import Path

def install_pyinstaller():
    """Install PyInstaller if not already installed"""
    try:
        import PyInstaller
        print("✓ PyInstaller is already installed")
        return True
    except ImportError:
        print("Installing PyInstaller...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])
            print("✓ PyInstaller installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install PyInstaller: {e}")
            return False

def install_dependencies():
    """Install required dependencies"""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install dependencies: {e}")
        return False

def build_executable():
    """Build the standalone executable using PyInstaller"""
    print("Building standalone executable...")
    
    # Clean up previous builds (with Windows permission handling)
    dist_path = Path("dist")
    build_path = Path("build")
    
    def safe_rmtree(path):
        """Safely remove directory tree, handling Windows file locks"""
        if not path.exists():
            return True
            
        try:
            shutil.rmtree(path)
            return True
        except PermissionError:
            print(f"⚠ Cannot remove {path} (files may be in use). Continuing...")
            # Try to remove individual files that aren't locked
            for root, dirs, files in os.walk(path, topdown=False):
                for file in files:
                    file_path = Path(root) / file
                    try:
                        file_path.unlink()
                    except PermissionError:
                        print(f"⚠ Skipping locked file: {file_path}")
                for dir in dirs:
                    dir_path = Path(root) / dir
                    try:
                        dir_path.rmdir()
                    except (PermissionError, OSError):
                        pass
            return False
        except Exception as e:
            print(f"⚠ Error removing {path}: {e}")
            return False
    
    if safe_rmtree(dist_path):
        print("✓ Cleaned up previous dist directory")
    
    if safe_rmtree(build_path):
        print("✓ Cleaned up previous build directory")
    
    # PyInstaller command
    cmd = [
        'pyinstaller',
        '--onefile',  # Create a single executable file
        '--noconsole',  # Don't show console window (for Windows)
        '--name', 'powerpoint-server',
        '--distpath', 'dist',
        '--workpath', 'build',
        '--specpath', '.',
        'main.py'
    ]
    
    try:
        subprocess.check_call(cmd)
        print("✓ Executable built successfully")
        
        # Check if executable was created
        executable_name = 'powerpoint-server.exe' if sys.platform.startswith('win') else 'powerpoint-server'
        executable_path = dist_path / executable_name
        
        if executable_path.exists():
            print(f"✓ Executable created: {executable_path}")
            print(f"✓ File size: {executable_path.stat().st_size / (1024*1024):.1f} MB")
            return True
        else:
            print("✗ Executable not found after build")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to build executable: {e}")
        return False

def test_executable():
    """Test the built executable"""
    print("Testing executable...")
    
    executable_name = 'powerpoint-server.exe' if sys.platform.startswith('win') else 'powerpoint-server'
    executable_path = Path("dist") / executable_name
    
    if not executable_path.exists():
        print("✗ Executable not found for testing")
        return False
    
    try:
        # Test that the executable can start (but don't leave it running)
        import subprocess
        import time
        
        # Start the server in background
        process = subprocess.Popen([str(executable_path)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Give it a moment to start
        time.sleep(2)
        
        # Check if it's still running (not crashed)
        if process.poll() is None:
            print("✓ Executable starts successfully")
            process.terminate()
            process.wait()
            return True
        else:
            stdout, stderr = process.communicate()
            print(f"✗ Executable failed to start:")
            print(f"STDOUT: {stdout.decode()}")
            print(f"STDERR: {stderr.decode()}")
            return False
            
    except Exception as e:
        print(f"✗ Error testing executable: {e}")
        return False

def main():
    """Main build process"""
    print("🔧 PowerPoint Generator - Building Standalone Executable")
    print("=" * 60)
    
    # Change to python directory
    os.chdir(Path(__file__).parent)
    
    steps = [
        ("Installing PyInstaller", install_pyinstaller),
        ("Installing Dependencies", install_dependencies),
        ("Building Executable", build_executable),
        ("Testing Executable", test_executable)
    ]
    
    for step_name, step_func in steps:
        print(f"\n📋 {step_name}...")
        if not step_func():
            print(f"\n❌ Build failed at: {step_name}")
            sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ Build completed successfully!")
    print("\nNext steps:")
    print("1. The executable is ready in python/dist/")
    print("2. Run 'npm run build' to create the full application package")
    print("3. Users can now run the app without installing Python")

if __name__ == "__main__":
    main()
