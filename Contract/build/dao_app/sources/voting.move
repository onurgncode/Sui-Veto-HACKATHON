#[allow(duplicate_alias)]
module dao_app::voting;

use sui::object::UID;
use sui::dynamic_field as df;

/// Vote types
#[allow(unused_const)]
const VOTE_NO: u8 = 0;
#[allow(unused_const)]
const VOTE_YES: u8 = 1;
#[allow(unused_const)]
const VOTE_ABSTAIN: u8 = 2;

/// Vote structure stored in Proposal using dynamic fields
public struct Vote has store, copy, drop {
    voter: address,
    vote_type: u8,
    vote_weight: u64,
    timestamp: u64,
}

/// Create a new vote
public fun new(
    voter: address,
    vote_type: u8,
    vote_weight: u64,
    timestamp: u64
): Vote {
    Vote {
        voter,
        vote_type,
        vote_weight,
        timestamp,
    }
}

/// Get voter address
public fun voter(vote: &Vote): address {
    vote.voter
}

/// Get vote type
public fun vote_type(vote: &Vote): u8 {
    vote.vote_type
}

/// Get vote weight
public fun vote_weight(vote: &Vote): u64 {
    vote.vote_weight
}

/// Get timestamp
public fun timestamp(vote: &Vote): u64 {
    vote.timestamp
}

/// Calculate vote weight based on level
public fun calculate_vote_weight(level: u64): u64 {
    if (level == 1) {
        1
    } else if (level <= 5) {
        level * 15 / 10
    } else if (level <= 10) {
        level * 2
    } else {
        level * 3
    }
}

/// Add vote to proposal
public fun add_vote(proposal_id: &mut UID, voter: address, vote: Vote) {
    df::add<address, Vote>(proposal_id, voter, vote);
}

/// Check if voter has already voted
public fun has_voted(proposal_id: &UID, voter: address): bool {
    df::exists_<address>(proposal_id, voter)
}

/// Get vote for a voter
public fun get_vote(proposal_id: &UID, voter: address): Option<Vote> {
    if (df::exists_<address>(proposal_id, voter)) {
        std::option::some(*df::borrow<address, Vote>(proposal_id, voter))
    } else {
        std::option::none()
    }
}

/// Remove vote
public fun remove_vote(proposal_id: &mut UID, voter: address) {
    if (df::exists_<address>(proposal_id, voter)) {
        df::remove<address, Vote>(proposal_id, voter);
    };
}

