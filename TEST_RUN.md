# Grading test run

Use the website's listed demonstration role unless marked Telegram. Commission order is Richard / Anastasia / Jean-Claude.

## Test 1

1. Link your Telegram user and chat IDs to Richard. In Telegram submit `/sale S01|Olivia Rose|A|One proud uncle and an emotional grandmother|1000|50|30|20`.
2. Re-link the same Telegram IDs to Kevin. In Telegram submit `/expense E01|Rented suit and fake pearl necklace for the relatives|Materials|120|A`.
3. As Anastasia, submit S02: Daniel King, B, `University friends, dancing, and the stripping performance`, €2,000, split 0/50/50.
4. As Kevin, submit E02: `Taxi for the grandmother; Kevin selected the wrong project`, Travel, €80, B; and E03: `Monthly company website subscription`, Other, €100, Company overhead.
5. As Svetlana, approve S01 unchanged; change S02 to 20/40/40 and approve; allocate E01 to A; change E02 to A and approve.

Expected: A €700, B €1,800, company €2,400; commission Richard €90, Anastasia €110, Jean-Claude €100.

## Test 2

1. As Jean-Claude, submit S03: Emma Stonebridge, A, `Premium relatives, including an uncle presented as a surgeon`, €1,500, 40/40/20.
2. As Richard, submit S04: Lucas Green, B, `Small group of loud university friends`, €800, 25/25/50; then S05: Mia Brooks, B, `Extra guests and an embarrassing speech`, €600, 100/0/0.
3. As Kevin, submit E04: `Replacement costumes after an enthusiastic dance performance`, Materials, €250, B; E05: `Minibus for university friends; Kevin selected the wrong project again`, Travel, €90, A; E06: `Company telephone subscription`, Other, €60, Company overhead; E07: `Emergency replacement clothing; project allocation still needs checking`, Materials, €140, A.
4. As Svetlana, change S03 to 20/30/50 and approve; approve S04 unchanged; leave S05 pending; allocate E04 to B; move E05 to B; leave E07 awaiting allocation.

Expected: A €2,050, B €2,180, company €3,930. Commissions: Richard €140, Anastasia €175, Jean-Claude €215. S05 remains pending and E07 awaiting allocation.

## Permission checks

Confirm the server rejects: a 60/30/20 split, sale approval as Richard, sale entry as Kevin, a missing or zero expense amount, a second approval, and a duplicate reference.
