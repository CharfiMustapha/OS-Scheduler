#include <stdio.h>
#include "../include/process.h"
#include "../include/colors.h"

void priority_preemptive(Process p[], int n) {

    for(int i = 0; i < n; i++) {
        p[i].remaining = p[i].burst;
    }

    int completed = 0;
    int time = 0;
    int current = -1;

    int gantt_time = 0;
    int total_time = 0;
    for(int i = 0; i < n; i++) total_time += p[i].burst;

    char gantt[n][total_time];
    for(int i = 0; i < n; i++)
        for(int t = 0; t < total_time; t++)
            gantt[i][t] = '.'; 

    printf("\n================ Priority Preemptive Scheduler =================\n");

    while(completed < n) {
        int best = -1;

        for(int i = 0; i < n; i++) {
            if(p[i].arrival <= time && p[i].remaining > 0) {
                if(best == -1 || p[i].priority < p[best].priority) {
                    best = i;
                }
            }
        }

        if(best != -1) {
            if(current != best) {
                if(current != -1)
                    printf("t=%d → Changement vers %s\n", time, p[best].name);
                else
                    printf("t=%d → Début %s\n", time, p[best].name);
                current = best;
            }

            gantt[best][gantt_time] = 'X';
            p[best].remaining--;
            gantt_time++;

            if(p[best].remaining == 0) {
                completed++;
                printf("t=%d → %s terminé\n", time+1, p[best].name);
            }
        } else {
            gantt_time++;
        }

        time++;
    }

    printf("\nGantt Chart:\nTime : ");
    for(int t = 0; t < gantt_time; t++) printf("%2d ", t);
    printf("\n");

    for(int i = 0; i < n; i++) {
        printf("%-6s: ", p[i].name);
        for(int t = 0; t < gantt_time; t++)
            printf("%s%s%s ", (gantt[i][t] == 'X' ? colors[i % 6] : ""), (gantt[i][t] == 'X' ? "█" : "."), (gantt[i][t] == 'X' ? RESET : ""));
        printf("\n");
    }

    printf("\nFin de l'ordonnancement Priorité Préemptive.\n");
    printf("================================================\n");
}