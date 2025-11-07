import React, { useEffect, useRef, useState } from 'react';

interface VideoCallProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoCall: React.FC<VideoCallProps> = ({ roomName, displayName, onClose }) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const meetingLink = `https://meet.jit.si/${roomName}`;

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Load Jitsi Meet External API script
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve(window.JitsiMeetExternalAPI);
        script.onerror = () => reject(new Error('Failed to load Jitsi Meet API. Please check your internet connection.'));
        document.body.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        console.log('Loading Jitsi Meet API...');
        await loadJitsiScript();
        console.log('Jitsi API loaded successfully');

        if (!jitsiContainerRef.current) return;

        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: displayName
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            enableWelcomePage: false,
            enableClosePage: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat',
              'settings', 'raisehand', 'videoquality', 'filmstrip', 'invite',
              'tileview', 'videobackgroundblur', 'help', 'mute-everyone',
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#474747',
            MOBILE_APP_PROMO: false,
          }
        };

        console.log('Initializing Jitsi conference with room:', roomName);
        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);

        // Set a timeout to stop loading after 10 seconds
        timeoutId = setTimeout(() => {
          console.log('Jitsi load timeout - hiding loading screen');
          setIsLoading(false);
        }, 10000);

        // Event listeners
        jitsiApiRef.current.on('videoConferenceJoined', () => {
          console.log('User joined the video conference');
          clearTimeout(timeoutId);
          setIsLoading(false);
        });

        jitsiApiRef.current.on('videoConferenceLeft', () => {
          console.log('User left the video conference');
          onClose();
        });

        jitsiApiRef.current.on('readyToClose', () => {
          console.log('Ready to close');
          onClose();
        });

        // Hide loading when iframe is ready
        jitsiApiRef.current.on('iframeReady', () => {
          console.log('Jitsi iframe ready');
          // Give it 2 more seconds then hide loading
          setTimeout(() => {
            setIsLoading(false);
          }, 2000);
        });

      } catch (err) {
        console.error('Failed to initialize Jitsi:', err);
        setError(err instanceof Error ? err.message : 'Failed to start video call. Please check your internet connection and try again.');
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };

    initializeJitsi();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [roomName, displayName, onClose]);

  const handleEndCall = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-white font-semibold text-lg">Video Meeting</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Room: {roomName}</span>
            <button
              onClick={copyMeetingLink}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
              title="Copy meeting link to invite others"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={handleEndCall}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
          End Call
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Connecting to video call...</p>
            <p className="text-gray-400 text-sm mt-2">Please allow camera and microphone access</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white text-lg mb-2">Connection Failed</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Jitsi Container */}
      <div ref={jitsiContainerRef} className="flex-1" />
    </div>
  );
};

export default VideoCall;
