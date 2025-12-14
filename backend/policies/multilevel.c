#include <stdio.h>
#include "../include/process.h"
#include "../include/colors.h"

void multilevel(Process p[], int n, int quantum) {

    int remaining[n], priority[n], waiting[n], turnaround[n], arrival_time[n];
    int time = 0, completed = 0;

    for(int i = 0; i < n; i++) {
        remaining[i] = p[i].burst;
        priority[i] = p[i].priority;
        waiting[i] = 0;
        turnaround[i] = 0;
        arrival_time[i] = p[i].arrival;
    }

    printf("\n================ Multi-Level avec aging (Quantum = %d) =================\n", quantum);    
    printf("%-5s %-10s %-8s %-6s %-8s\n", "ID", "Process", "Arrival", "Burst", "Priority");
    printf("-----------------------------------------------------------------\n");
    for(int i = 0; i < n; i++)
        printf("%-5d %-10s %-8d %-6d %-8d\n", i+1, p[i].name, p[i].arrival, p[i].burst, p[i].priority);

    printf("\nGantt Chart:\n");

    int total_time = 0;
    for(int i = 0; i < n; i++) {
        if(total_time < p[i].arrival) total_time = p[i].arrival;
        total_time += p[i].burst;
    }

    int timeline[total_time];
    int timeline_level1[total_time];
    int timeline_level2[total_time];
    for(int i = 0; i < total_time; i++) {
        timeline[i] = -1;
        timeline_level1[i] = -1;
        timeline_level2[i] = -1;
    }

    time = 0;
    completed = 0;
    for(int i = 0; i < n; i++) {
        remaining[i] = p[i].burst;
        priority[i] = p[i].priority;
    }

    while(completed < n) {
        int min_priority = 1000;
        int count_min = 0;
        int indices[n];
        for(int i = 0; i < n; i++) {
            if(remaining[i] > 0 && p[i].arrival <= time) {
                if(priority[i] < min_priority) {
                    min_priority = priority[i];
                    count_min = 1;
                    indices[0] = i;
                } else if(priority[i] == min_priority) {
                    indices[count_min++] = i;
                }
            }
        }

        if(count_min == 0) {
            timeline[time] = -1;
            timeline_level1[time] = -1;
            timeline_level2[time] = -1;
            time++;
            continue;
        }

        if(count_min == 1) {
            int i = indices[0];
            timeline[time] = i;
            timeline_level1[time] = i;
            timeline_level2[time] = -1;
            remaining[i]--;
            priority[i]++;
            for(int j = 0; j < n; j++)
                if(j != i && remaining[j] > 0 && p[j].arrival <= time)
                    waiting[j]++;
            if(remaining[i] == 0)
                turnaround[i] = time + 1 - arrival_time[i], completed++;
            time++;
        } else {
            int q = quantum;
            for(int k = 0; k < count_min; k++) {
                int i = indices[k];
                int t = 0;
                while(t < q && remaining[i] > 0) {
                    timeline[time] = i;
                    timeline_level1[time] = -1;
                    timeline_level2[time] = i;
                    remaining[i]--;
                    for(int j = 0; j < n; j++)
                        if(j != i && remaining[j] > 0 && p[j].arrival <= time)
                            waiting[j]++;
                    t++;
                    time++;
                    if(remaining[i] == 0) {
                        turnaround[i] = time - arrival_time[i];
                        completed++;
                        break;
                    }
                }
                priority[i]++;
            }
        }
    }

    printf("\n");
    for(int proc = 0; proc < n; proc++) {
        printf("%-6s: ", p[proc].name);
        for(int t = 0; t < time; t++) {
            if(timeline[t] == proc)
                printf("%s█%s ", colors[proc % 6], RESET);
            else
                printf(" . ");
        }
        printf("\n");
    }

    printf("\nTimeline by Level:\n       ");
    for(int t = 0; t < time; t++)
        printf("%-4d", t);
    printf("\nLevel 1 ");
    for(int t = 0; t < time; t++) {
        if(timeline_level1[t] != -1)
            printf("%-4s", p[timeline_level1[t]].name);
        else
            printf("    ");
    }
    printf("\nLevel 2 ");
    for(int t = 0; t < time; t++) {
        if(timeline_level2[t] != -1)
            printf("%-4s", p[timeline_level2[t]].name);
        else
            printf("    ");
    }
    printf("\n");

    printf("\nSummary:\n");
    printf("%-10s %-10s %-10s\n", "Process", "Waiting", "Turnaround");
    for(int i = 0; i < n; i++)
        printf("%-10s %-10d %-10d\n", p[i].name, waiting[i], turnaround[i]);

    printf("===============================================================\n");
    printf("End of Multi-Level avec aging scheduling.\n\n");
}