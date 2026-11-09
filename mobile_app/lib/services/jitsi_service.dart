import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';
import '../models/user_model.dart';
import '../models/booking_model.dart';

class JitsiService {
  JitsiMeet? _jitsiMeet;

  JitsiMeet get jitsiMeet {
    if (kIsWeb) {
      throw UnsupportedError('Native Jitsi SDK is not supported on web. Use browser launch instead.');
    }
    return _jitsiMeet ??= JitsiMeet();
  }

  /// Generates a deterministic, collision-resistant room name for live yoga classes
  static String generateRoomName(String classId, String classTitle) {
    final cleanId = classId.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_').toLowerCase();
    final cleanTitle = classTitle.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_').toLowerCase();
    final combined = 'yoga_studio_${cleanId}_$cleanTitle'
        .replaceAll(RegExp(r'_+'), '_')
        .replaceAll(RegExp(r'^_+|_+$'), '');
    return combined.length > 50 ? combined.substring(0, 50) : combined;
  }

  /// Formats server URL ensuring https scheme
  static String formatServerUrl(String serverDomain) {
    if (serverDomain.startsWith('http://') || serverDomain.startsWith('https://')) {
      return serverDomain;
    }
    return 'https://$serverDomain';
  }

  /// Builds Jitsi conference options with optimal practitioner defaults
  static JitsiMeetConferenceOptions buildConferenceOptions({
    required BookingModel booking,
    required UserModel user,
    String serverDomain = 'meet.jit.si',
  }) {
    final roomName = booking.jitsiRoom ?? generateRoomName(booking.classId, booking.classTitle);
    final serverUrl = formatServerUrl(serverDomain);

    return JitsiMeetConferenceOptions(
      serverURL: serverUrl,
      room: roomName,
      configOverrides: {
        'startWithAudioMuted': true, // Audio muted by default for quiet entrance
        'startWithVideoMuted': false, // Video camera enabled
        'subject': booking.classTitle,
        'requireDisplayName': true,
        'enableWelcomePage': false,
        'enableClosePage': false,
      },
      featureFlags: {
        'welcomePageEnabled': false,
        'prejoinPageEnabled': false,
        'invite.enabled': false,
        'pip.enabled': true, // Picture-in-picture mode enabled
        'chat.enabled': true,
        'raise-hand.enabled': true,
        'recording.enabled': false,
        'live-streaming.enabled': false,
        'tile-view.enabled': true,
      },
      userInfo: JitsiMeetUserInfo(
        displayName: user.fullName,
        email: user.email,
        avatar: user.photoUrl,
      ),
    );
  }

  /// Generates the Web direct meeting URL for browsers
  static String buildWebMeetingUrl({
    required BookingModel booking,
    required UserModel user,
    String serverDomain = 'meet.jit.si',
  }) {
    final roomName = booking.jitsiRoom ?? generateRoomName(booking.classId, booking.classTitle);
    final serverUrl = formatServerUrl(serverDomain);
    final encodedName = Uri.encodeComponent(user.fullName);
    final encodedEmail = Uri.encodeComponent(user.email);
    return '$serverUrl/$roomName#userInfo.displayName="$encodedName"&userInfo.email="$encodedEmail"&config.startWithAudioMuted=true&config.startWithVideoMuted=false';
  }

  /// Joins a secure live yoga session with gating verification
  Future<void> joinLiveYogaSession({
    required BuildContext context,
    required BookingModel booking,
    required UserModel user,
    String serverDomain = 'meet.jit.si',
  }) async {
    // 1. Verify eligibility window (15 mins before class start until end)
    if (!booking.canJoinLive) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('The live yoga sanctuary opens 15 minutes prior to class start time.'),
          backgroundColor: Colors.brown,
        ),
      );
      return;
    }

    // 2. Web browser branch: Launch direct web meeting URL without invoking native mobile SDK
    if (kIsWeb) {
      final webUrl = buildWebMeetingUrl(
        booking: booking,
        user: user,
        serverDomain: serverDomain,
      );
      final uri = Uri.parse(webUrl);
      try {
        final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
        if (!launched) {
          await launchUrl(uri, mode: LaunchMode.platformDefault);
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Could not open live yoga session in browser: $e'),
              backgroundColor: Colors.red.shade800,
            ),
          );
        }
      }
      return;
    }

    // 3. Native mobile branch (Android & iOS): Launch native Jitsi Meet SDK
    final options = buildConferenceOptions(
      booking: booking,
      user: user,
      serverDomain: serverDomain,
    );

    try {
      await jitsiMeet.join(options);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not launch Jitsi video session: $e'),
            backgroundColor: Colors.red.shade800,
          ),
        );
      }
    }
  }

  /// Hangs up the conference
  void leaveSession() {
    if (kIsWeb) return;
    try {
      jitsiMeet.hangUp();
    } catch (_) {}
  }
}
