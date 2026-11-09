import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/class_model.dart';

class ClassCard extends StatelessWidget {
  final ClassModel yogaClass;
  final VoidCallback onBookTap;

  const ClassCard({
    super.key,
    required this.yogaClass,
    required this.onBookTap,
  });

  @override
  Widget build(BuildContext context) {
    final timeFormat = DateFormat('hh:mm a');
    final formattedTime = '${timeFormat.format(yogaClass.startTime)} - ${timeFormat.format(yogaClass.endTime)}';
    final isOnline = yogaClass.isOnline;
    final isFull = yogaClass.isFull;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.pureWhite,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppTheme.borderSubtle, width: 1),
        boxShadow: [
          BoxShadow(
            color: AppTheme.darkText.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Badges
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isOnline ? const Color(0xFFEFF2FE) : const Color(0xFFFEF3E8),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isOnline ? const Color(0xFFD3DCFC) : const Color(0xFFF9DCBF),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isOnline ? Icons.videocam_rounded : Icons.location_on_rounded,
                          size: 13,
                          color: isOnline ? const Color(0xFF3B5EDB) : const Color(0xFFB55D0F),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          isOnline ? 'ONLINE STREAM' : 'STUDIO SANCTUARY',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                            color: isOnline ? const Color(0xFF3B5EDB) : const Color(0xFFB55D0F),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.cream,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.warmBeige),
                    ),
                    child: Text(
                      yogaClass.category,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.darkText,
                      ),
                    ),
                  ),
                ],
              ),
              Text(
                '${yogaClass.durationMinutes} min',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.mutedText,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Title
          Text(
            yogaClass.title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.darkText,
              fontFamily: 'Playfair Display',
            ),
          ),

          const SizedBox(height: 4),

          // Instructor & Time
          Row(
            children: [
              const Icon(Icons.person_outline, size: 14, color: AppTheme.burgundy),
              const SizedBox(width: 4),
              Text(
                yogaClass.instructorName,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.darkText,
                ),
              ),
              const SizedBox(width: 12),
              const Icon(Icons.access_time_rounded, size: 14, color: AppTheme.sageGreen),
              const SizedBox(width: 4),
              Text(
                formattedTime,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.mutedText,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Footer: Available seats & Book button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isFull ? 'Class Full' : '${yogaClass.availableSeats} spots left',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isFull ? Colors.red : AppTheme.sageGreen,
                    ),
                  ),
                  Text(
                    'Max ${yogaClass.capacity} yogis',
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppTheme.mutedText,
                    ),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: isFull ? null : onBookTap,
                style: ElevatedButton.styleFrom(
                  backgroundColor: isFull ? Colors.grey.shade300 : AppTheme.burgundy,
                  foregroundColor: AppTheme.pureWhite,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  isFull ? 'Fully Booked' : 'Book Class',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

