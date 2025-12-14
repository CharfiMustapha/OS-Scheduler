
#include <stdio.h>
#include <string.h>
#include "../include/process.h"
#include "../include/colors.h"

void sjf(Process p[], int n) {

    int waiting[n], turnaround[n], completed = 0;
    int is_completed[n];

    for(int i = 0; i < n; i++) is_completed[i] = 0;

    for(int i = 0; i < n-1; i++) {
        for(int j = i+1; j < n; j++) {
            if(p[i].arrival > p[j].arrival) {
                Process tmp = p[i];
                p[i] = p[j];
                p[j] = tmp;
            }
        }
    }

    printf("\n================ SJF Scheduler (Non-preemptive) =================\n");

    printf("%-5s %-10s %-8s %-6s\n", "ID", "Process", "Arrival", "Burst");
    printf("-----------------------------------------------\n");
    for(int i = 0; i < n; i++)
        printf("%-5d %-10s %-8d %-6d\n", i+1, p[i].name, p[i].arrival, p[i].burst);

    int total_time = 0;
    for(int i = 0; i < n; i++)
        if(total_time < p[i].arrival) total_time = p[i].arrival;
    for(int i = 0; i < n; i++) total_time += p[i].burst;

    printf("\nGantt Chart:\n");
    printf("Time : ");
    for(int t = 0; t < total_time; t++) printf("%2d ", t);
    printf("\n");

    int gantt_time = 0;
    while(completed < n) {
        int idx = -1;
        int min_burst = 1e9;

        for(int i = 0; i < n; i++) {
            if(p[i].arrival <= gantt_time && !is_completed[i]) {
                if(p[i].burst < min_burst) {
                    min_burst = p[i].burst;
                    idx = i;
                }
            }
        }

        if(idx != -1) {
            printf("%-6s: ", p[idx].name);
            for(int t = 0; t < total_time; t++) {
                if(t >= gantt_time && t < gantt_time + p[idx].burst)
                    printf("%s█%s ", colors[idx % 6], RESET);
                else
                    printf(" . ");
            }
            printf("\n");

            waiting[idx] = gantt_time - p[idx].arrival;
            if(waiting[idx] < 0) waiting[idx] = 0;
            turnaround[idx] = waiting[idx] + p[idx].burst;

            gantt_time += p[idx].burst;
            is_completed[idx] = 1;
            completed++;
        } else {
            gantt_time++;
        }
    }

    printf("\nSummary:\n");
    printf("%-10s %-10s %-10s\n", "Process", "Waiting", "Turnaround");
    for(int i = 0; i < n; i++)
        printf("%-10s %-10d %-10d\n", p[i].name, waiting[i], turnaround[i]);

    printf("================================================\n");
    printf("End of SJF scheduling.\n\n");
}