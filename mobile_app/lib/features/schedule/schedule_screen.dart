import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../models/class_model.dart';
import '../../providers/classes_provider.dart';
import '../../shared/widgets/class_card.dart';

class ScheduleScreen extends ConsumerStatefulWidget {
  const ScheduleScreen({super.key});

  @override
  ConsumerState<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends ConsumerState<ScheduleScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTime _selectedDate = DateTime.now();
  String _selectedCategory = 'All Categories';
  String _selectedTeacher = 'All Teachers';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _resetFilters() {
    setState(() {
      _selectedCategory = 'All Categories';
      _selectedTeacher = 'All Teachers';
      _selectedDate = DateTime.now();
      _searchQuery = '';
    });
  }

  void _openTeacherFilterSheet(List<String> teachers) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      backgroundColor: AppTheme.pureWhite,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Filter by Teacher',
              style: TextStyle(
                fontFamily: 'Playfair Display',
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.darkText,
              ),
            ),
            const SizedBox(height: 16),
            ...teachers.map(
              (t) => ListTile(
                title: Text(t, style: const TextStyle(fontSize: 14)),
                trailing: _selectedTeacher == t ? const Icon(Icons.check, color: AppTheme.burgundy) : null,
                onTap: () {
                  setState(() => _selectedTeacher = t);
                  Navigator.pop(ctx);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final classesAsync = ref.watch(classesStreamProvider);
    final teacherSet = classesAsync.value?.map((c) => c.instructorName.trim()).where((name) => name.isNotEmpty).toSet() ?? <String>{};
    final availableTeachers = ['All Teachers', ...teacherSet.toList()..sort()];

    // Generate 7-day strip centered on current week
    final now = DateTime.now();
    final weekDays = List.generate(7, (i) => now.add(Duration(days: i - 1)));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daily Class Schedule'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_rounded, color: AppTheme.burgundy),
            tooltip: 'Filter by Teacher',
            onPressed: () => _openTeacherFilterSheet(availableTeachers),
          ),
          TextButton(
            onPressed: _resetFilters,
            child: const Text(
              'Reset',
              style: TextStyle(
                color: AppTheme.burgundy,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 7-Day Horizontal Strip
            Container(
              height: 72,
              padding: const EdgeInsets.symmetric(vertical: 8),
              color: AppTheme.pureWhite,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: weekDays.length,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (context, index) {
                  final date = weekDays[index];
                  final isSelected = date.day == _selectedDate.day &&
                      date.month == _selectedDate.month &&
                      date.year == _selectedDate.year;

                  return GestureDetector(
                    onTap: () => setState(() => _selectedDate = date),
                    child: Container(
                      width: 52,
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.burgundy : AppTheme.softBackground,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? AppTheme.burgundy : AppTheme.borderSubtle,
                        ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: AppTheme.burgundy.withOpacity(0.2),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                )
                              ]
                            : null,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            DateFormat('EEE').format(date).toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                              color: isSelected ? AppTheme.warmBeige : AppTheme.mutedText,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${date.day}',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? AppTheme.pureWhite : AppTheme.darkText,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // Category Filter Chips
            Container(
              height: 48,
              padding: const EdgeInsets.symmetric(vertical: 6),
              color: AppTheme.pureWhite,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: AppConstants.defaultCategories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final cat = AppConstants.defaultCategories[index];
                  final isSelected = cat == _selectedCategory;
                  return ChoiceChip(
                    label: Text(
                      cat,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? AppTheme.pureWhite : AppTheme.darkText,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppTheme.burgundy,
                    backgroundColor: AppTheme.softBackground,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    onSelected: (selected) {
                      if (selected) setState(() => _selectedCategory = cat);
                    },
                  );
                },
              ),
            ),

            const SizedBox(height: 12),

            // Tab Bar for Clearly Separated ONLINE and OFFLINE classes
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppTheme.warmBeige.withOpacity(0.4),
                borderRadius: BorderRadius.circular(16),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: AppTheme.burgundy,
                  borderRadius: BorderRadius.circular(16),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: AppTheme.pureWhite,
                unselectedLabelColor: AppTheme.mutedText,
                labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                tabs: const [
                  Tab(
                    icon: Icon(Icons.videocam_rounded, size: 16),
                    text: 'ONLINE CLASSES',
                  ),
                  Tab(
                    icon: Icon(Icons.spa_rounded, size: 16),
                    text: 'OFFLINE CLASSES',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Tab Views: Online & Offline
            Expanded(
              child: classesAsync.when(
                data: (allClasses) {
                  // Filter by category, teacher, search query
                  final filtered = allClasses.where((c) {
                    final matchesCategory = _selectedCategory == 'All Categories' || c.category == _selectedCategory;
                    final matchesTeacher = _selectedTeacher == 'All Teachers' || c.instructorName == _selectedTeacher;
                    final matchesSearch = _searchQuery.isEmpty ||
                        c.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                        c.instructorName.toLowerCase().contains(_searchQuery.toLowerCase());
                    return matchesCategory && matchesTeacher && matchesSearch;
                  }).toList();

                  final onlineList = filtered.where((c) => c.isOnline).toList();
                  final offlineList = filtered.where((c) => !c.isOnline).toList();

                  return TabBarView(
                    controller: _tabController,
                    children: [
                      // Section 1: Online Classes
                      _buildClassList(onlineList, isOnline: true),
                      // Section 2: Offline Classes
                      _buildClassList(offlineList, isOnline: false),
                    ],
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, color: Colors.amber, size: 36),
                        const SizedBox(height: 12),
                        Text('Unable to load schedule: $err', textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.mutedText)),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () => ref.invalidate(classesStreamProvider),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClassList(List<ClassModel> list, {required bool isOnline}) {
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isOnline ? Icons.videocam_off_rounded : Icons.spa_outlined,
              size: 48,
              color: AppTheme.mutedText.withOpacity(0.5),
            ),
            const SizedBox(height: 12),
            Text(
              isOnline ? 'No Online Classes on this date' : 'No Studio Classes on this date',
              style: const TextStyle(color: AppTheme.mutedText, fontSize: 14),
            ),
            const SizedBox(height: 6),
            Text(
              _selectedCategory != 'All Categories' ? 'Try resetting category filter' : 'Check surrounding days in calendar',
              style: const TextStyle(color: AppTheme.mutedText, fontSize: 12),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final c = list[index];
        return ClassCard(
          yogaClass: c,
          onBookTap: () {
            if (c.isOnline) {
              context.push('/online-booking', extra: c);
            } else {
              context.push('/offline-booking', extra: c);
            }
          },
        );
      },
    );
  }
}
