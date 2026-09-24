The developer is refining {scope_label}. Their message:

---
{message}
---

Apply it. The rules that govern every refinement:

1. **Propagate.** A change updates every section of every document it affects, not just the one the
   developer named. Follow both the shared names and the recorded derivations: if a movement speed
   changes, the playtimes and beat durations derived from it change too.
2. **Write back upstream.** If the change contradicts the design set — a brief now says something
   `design/art-bible.md` or another doc denies — update the design document as well, so the set
   stays one truth. This applies in both directions.
3. **Keep numbers concrete.** Any new value is a number with a unit, and records what it derives
   from. Choices the developer did not state go in the assumptions list.
4. **Do not regenerate images.** You write text. The harness regenerates reference images on its
   own, only when asked.
5. **Stay in scope.** Change what the message asks for and what follows from it. Do not rewrite
   documents the change does not touch, and do not "improve" prose you were not asked about.

When you are done, reply with a short change summary: which files you touched and why, one line
each, and name anything you deliberately did not change.
