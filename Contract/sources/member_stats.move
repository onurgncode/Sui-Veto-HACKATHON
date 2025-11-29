module dao_app::member_stats;

/// Member statistics tracking XP and level
public struct MemberStats has store, copy, drop {
    xp: u64,
    level: u64,
}

/// Create new member stats with initial values
public fun new(xp: u64, level: u64): MemberStats {
    MemberStats { xp, level }
}

/// Get XP from member stats
public fun get_xp(stats: &MemberStats): u64 {
    stats.xp
}

/// Get level from member stats
public fun get_level(stats: &MemberStats): u64 {
    stats.level
}

/// Add XP to member stats and update level
public fun add_xp(stats: &mut MemberStats, xp_amount: u64) {
    stats.xp = stats.xp + xp_amount;
    stats.level = stats.xp / 100 + 1;
}

