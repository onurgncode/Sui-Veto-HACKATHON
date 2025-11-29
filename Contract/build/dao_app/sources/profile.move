#[allow(duplicate_alias)]
module dao_app::profile;

use sui::object::{UID, ID};
use sui::transfer;
use sui::tx_context::TxContext;
use std::string::String;
use sui::dynamic_field as df;
use std::option::Option;
use dao_app::member_stats::{Self, MemberStats};

/// Profile structure with dynamic field for membership statistics
public struct Profile has key {
    id: UID,
    nickname: String,
    owner: address,
}

/// Create a new profile for the sender
#[allow(lint(public_entry))]
public entry fun create(nickname: String, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    let profile = Profile {
        id: object::new(ctx),
        nickname,
        owner: sender,
    };
    transfer::transfer(profile, sender);
}

/// Get the ID of a profile
public fun id(profile: &Profile): ID {
    object::id(profile)
}

/// Get the nickname of a profile
public fun nickname(profile: &Profile): String {
    profile.nickname
}

/// Get the owner of a profile
public fun owner(profile: &Profile): address {
    profile.owner
}

/// Check if an address owns the profile
public fun is_owner(profile: &Profile, addr: address): bool {
    profile.owner == addr
}

/// Initialize member stats for this profile in a specific community
public fun init_member_stats(profile: &mut Profile, commity_id: ID) {
    if (!df::exists_<ID>(&profile.id, commity_id)) {
        let stats = member_stats::new(0, 1);
        df::add<ID, MemberStats>(&mut profile.id, commity_id, stats);
    };
}

/// Get member stats for a profile in a specific community
public fun get_member_stats(profile: &Profile, commity_id: ID): Option<MemberStats> {
    if (df::exists_<ID>(&profile.id, commity_id)) {
        option::some(*df::borrow<ID, MemberStats>(&profile.id, commity_id))
    } else {
        option::none()
    }
}

/// Get or create member stats for a profile in a specific community
public fun get_or_create_member_stats(profile: &mut Profile, commity_id: ID): &mut MemberStats {
    if (!df::exists_<ID>(&profile.id, commity_id)) {
        let stats = member_stats::new(0, 1);
        df::add<ID, MemberStats>(&mut profile.id, commity_id, stats);
    };
    df::borrow_mut<ID, MemberStats>(&mut profile.id, commity_id)
}

/// Check if profile has stats for a community
public fun has_member_stats(profile: &Profile, commity_id: ID): bool {
    df::exists_<ID>(&profile.id, commity_id)
}

